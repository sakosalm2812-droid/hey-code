import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Film,
  Image as ImageIcon,
  LoaderCircle,
  Music2,
  Play,
  RotateCcw,
  Scissors,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from "lucide-react";

import { detectMediaKind, mediaEditEngine } from "../core/mediaEditEngine.js";
import { makeLocalMediaPlan, requestHeyMediaPlan } from "../core/mediaAiPlanner.js";
import styles from "./MediaStudio.module.css";

const QUICK_PROMPTS = [
  "Crop this to 9:16, make it 1080p, and compress it.",
  "Remove the first 3 seconds and add a fade in and fade out.",
  "Make this 1.5x faster and boost the audio a little.",
  "Extract the audio as MP3 and clean up background noise.",
  "Find the best moments and turn this into a short vertical highlight.",
  "Add captions and remove boring pauses while keeping the important parts.",
];

function formatBytes(bytes = 0) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}

function formatTime(seconds = 0) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function MediaPreview({ file, url, onMetadata }) {
  const kind = detectMediaKind(file);
  if (!file || !url) return null;

  if (kind === "video") {
    return (
      <video
        className={styles.previewMedia}
        controls
        src={url}
        onLoadedMetadata={(event) => onMetadata?.({
          duration: event.currentTarget.duration,
          width: event.currentTarget.videoWidth,
          height: event.currentTarget.videoHeight,
        })}
      />
    );
  }
  if (kind === "audio") {
    return (
      <audio
        className={styles.previewAudio}
        controls
        src={url}
        onLoadedMetadata={(event) => onMetadata?.({ duration: event.currentTarget.duration })}
      />
    );
  }
  return <img className={styles.previewImage} src={url} alt="Uploaded media preview" />;
}

function KindIcon({ kind }) {
  if (kind === "video") return <Film size={18} />;
  if (kind === "audio") return <Music2 size={18} />;
  return <ImageIcon size={18} />;
}

export default function MediaStudio() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [metadata, setMetadata] = useState({ duration: 0, width: 0, height: 0 });
  const [instruction, setInstruction] = useState("");
  const [plan, setPlan] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);

  const kind = useMemo(() => detectMediaKind(file), [file]);

  useEffect(() => {
    const unsubscribe = mediaEditEngine.subscribeProgress((update) => {
      setProgress(Math.round(Number(update?.progress || 0) * 100));
      setStage(update?.stage || "rendering");
    });
    return unsubscribe;
  }, []);

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);

  useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result?.url]);

  function chooseFile(nextFile) {
    if (!nextFile) return;
    const nextKind = detectMediaKind(nextFile);
    if (nextKind === "unknown") {
      setError("Choose a video, audio, or image file.");
      return;
    }
    if (nextFile.size > 350 * 1024 * 1024) {
      setError("For launch, local Media Studio accepts files up to 350 MB so the browser does not run out of memory.");
      return;
    }
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(nextFile);
    setSourceUrl(URL.createObjectURL(nextFile));
    setMetadata({ duration: 0, width: 0, height: 0 });
    setPlan(null);
    setResult(null);
    setProgress(0);
    setStage("");
    setError("");
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  function makePlan() {
    if (!file) {
      setError("Add a media file first.");
      return;
    }
    if (!instruction.trim()) {
      setError("Tell HEY what you want changed.");
      return;
    }
    setError("");
    setPlan(makeLocalMediaPlan(instruction, { ...metadata, kind }));
  }

  async function analyzeWithHey() {
    if (!file) {
      setError("Add a media file first.");
      return;
    }
    if (!instruction.trim()) {
      setError("Tell HEY what you want changed.");
      return;
    }
    setPlanning(true);
    setError("");
    try {
      const aiPlan = await requestHeyMediaPlan(file, instruction, { ...metadata, kind });
      setPlan(aiPlan);
    } catch (analysisError) {
      const fallback = makeLocalMediaPlan(instruction, { ...metadata, kind });
      setPlan({
        ...fallback,
        warnings: [
          `HEY media analysis was unavailable: ${analysisError.message}`,
          ...fallback.warnings,
        ],
      });
    } finally {
      setPlanning(false);
    }
  }

  async function renderEdit() {
    if (!file || !plan?.operations?.length) {
      setError("There is no executable local edit yet. Generate a plan with at least one supported operation first.");
      return;
    }
    setRendering(true);
    setError("");
    setProgress(0);
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    try {
      const rendered = await mediaEditEngine.render(file, plan, metadata);
      setResult(rendered);
    } catch (renderError) {
      setError(renderError.message || "HEY could not render this edit.");
    } finally {
      setRendering(false);
    }
  }

  function reset() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setSourceUrl("");
    setMetadata({ duration: 0, width: 0, height: 0 });
    setInstruction("");
    setPlan(null);
    setResult(null);
    setProgress(0);
    setStage("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}><Sparkles size={14} /> HEY Media Studio</span>
          <h1>Edit media by <em>asking.</em></h1>
          <p>
            Drop in a video, audio file, or image. Describe the result you want, let HEY build a safe edit plan,
            and render supported edits locally in your browser.
          </p>
        </div>
        <div className={styles.heroBadge}>
          <ShieldCheck size={18} />
          <span><strong>Local by default</strong><small>Your file uploads only when you choose “Analyze with HEY”.</small></span>
        </div>
      </section>

      <section className={styles.workspace}>
        <div className={styles.leftColumn}>
          {!file ? (
            <button
              type="button"
              className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <span className={styles.dropIcon}><UploadCloud size={28} /></span>
              <strong>Drop your media here</strong>
              <span>Video · Audio · Image · up to 350 MB for local rendering</span>
              <small>or click to choose a file</small>
            </button>
          ) : (
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <div className={styles.fileIdentity}>
                  <span><KindIcon kind={kind} /></span>
                  <div><strong>{file.name}</strong><small>{formatBytes(file.size)}{metadata.duration ? ` · ${formatTime(metadata.duration)}` : ""}</small></div>
                </div>
                <button type="button" className={styles.iconButton} onClick={reset} title="Start over"><RotateCcw size={17} /></button>
              </div>
              <div className={styles.previewStage}>
                <MediaPreview file={file} url={sourceUrl} onMetadata={(value) => setMetadata((current) => ({ ...current, ...value }))} />
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            className={styles.hiddenInput}
            type="file"
            accept="video/*,audio/*,image/*"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />

          {result && (
            <div className={styles.resultCard}>
              <div className={styles.resultTop}>
                <div><span className={styles.eyebrow}>Rendered</span><h2>Your HEY edit is ready.</h2></div>
                <a className={styles.downloadButton} href={result.url} download={result.filename}><Download size={17} /> Download</a>
              </div>
              <MediaPreview file={{ ...file, type: result.mimeType, name: result.filename }} url={result.url} />
              <small className={styles.resultMeta}>{formatBytes(result.size)} · rendered locally</small>
            </div>
          )}
        </div>

        <aside className={styles.controlPanel}>
          <div className={styles.controlHeader}>
            <span className={styles.eyebrow}>Director</span>
            <h2>What should HEY do?</h2>
          </div>

          <textarea
            className={styles.prompt}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="Example: Find the best moments, make it a fast 9:16 short, remove boring pauses, clean the audio, and export it at 1080p."
            rows={6}
          />

          <div className={styles.quickPrompts}>
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" onClick={() => setInstruction(prompt)}>{prompt}</button>
            ))}
          </div>

          <div className={styles.actionRow}>
            <button type="button" className={styles.secondaryButton} onClick={makePlan} disabled={!file || planning || rendering}>
              <Scissors size={17} /> Plan locally
            </button>
            <button type="button" className={styles.primaryButton} onClick={analyzeWithHey} disabled={!file || planning || rendering}>
              {planning ? <LoaderCircle className={styles.spin} size={17} /> : <WandSparkles size={17} />}
              {planning ? "Analyzing…" : "Analyze with HEY"}
            </button>
          </div>

          {plan && (
            <div className={styles.planCard}>
              <div className={styles.planHeader}>
                <div><span>{plan.source === "ai" ? "AI media plan" : "Local instruction plan"}</span><strong>{plan.summary}</strong></div>
                <span className={styles.planCount}>{plan.operations.length}</span>
              </div>

              {plan.operations.length > 0 ? (
                <div className={styles.operations}>
                  {plan.operations.map((operation, index) => (
                    <div key={`${operation.op}-${index}`} className={styles.operation}>
                      <Play size={13} />
                      <span>{operation.op.replaceAll("_", " ")}</span>
                      <code>{Object.entries(operation).filter(([key]) => key !== "op").map(([key, value]) => `${key}=${value}`).join(" · ")}</code>
                    </div>
                  ))}
                </div>
              ) : <p className={styles.emptyPlan}>No exact local operation could be safely inferred yet.</p>}

              {plan.semanticRequests?.length > 0 && (
                <div className={styles.semanticBox}>
                  <strong>Content-aware requests</strong>
                  {plan.semanticRequests.map((item) => <span key={item}>{item}</span>)}
                </div>
              )}

              {plan.warnings?.length > 0 && (
                <div className={styles.warnings}>{plan.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>
              )}

              <button type="button" className={styles.renderButton} onClick={renderEdit} disabled={rendering || !plan.operations.length}>
                {rendering ? <LoaderCircle className={styles.spin} size={18} /> : <Film size={18} />}
                {rendering ? `Rendering ${progress}%` : "Render edit"}
              </button>

              {rendering && (
                <div className={styles.progressTrack} aria-label={`Render progress ${progress}%`}>
                  <span style={{ width: `${Math.max(2, progress)}%` }} />
                  <small>{stage === "loading" ? "Loading media engine…" : "Rendering locally…"}</small>
                </div>
              )}
            </div>
          )}

          {error && <div className={styles.error} role="alert">{error}</div>}

          <div className={styles.privacyNote}>
            <ShieldCheck size={16} />
            <p><strong>Two editing paths.</strong> Exact edits can stay completely local. Content-aware editing sends the file to your configured HEY backend only when you explicitly ask HEY to analyze it.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
