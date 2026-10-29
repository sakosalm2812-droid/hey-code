// One page catalog for navigation, contextual destinations and global search.
export const HEY_PAGES = [
  ['HEY', '/chat', 'hey', 'chat conversation voice'],
  ['Create', '/media', 'create', 'edit video audio media'],
  ['Projects', '/projects', 'projects', 'files workspaces research'],
  ['Cosmos', '/cosmos', 'cosmos', 'knowledge context intelligence'],
  ['Missions', '/missions', 'missions', 'jobs automation approvals'],
  ['Forge', '/forge', 'forge', 'workflows skills integrations tools'],
  ['World', '/world', 'world', 'themes wallpaper personalization'],
  ['Studio', '/studio', 'create', 'image video generation documents presentations'],
  ['Tasks', '/tasks', 'projects', 'todos work'],
  ['Notes', '/notes', 'projects', 'writing capture'],
  ['Memory', '/memory', 'cosmos', 'personal long term memories'],
  ['Inbox', '/inbox', 'missions', 'notifications updates approvals'],
  ['Agents', '/agents', 'forge', 'specialists workforce'],
  ['Capabilities', '/capabilities', 'forge', 'health availability setup'],
  ['Devices', '/device', 'forge', 'desktop computer gesture control'],
  ['Permissions', '/permissions', 'forge', 'consent security access'],
  ['Debug', '/debug', 'forge', 'diagnostics'],
  ['Customization', '/customization', 'world', 'appearance'],
  ['Modes', '/modes', 'world', 'interface experiences'],
  ['Dashboard', '/dashboard', 'more', 'overview widgets'],
  ['Calendar', '/calendar', 'more', 'schedule events'],
  ['Analytics', '/analytics', 'more', 'insights metrics'],
  ['Deen', '/deen', 'more', 'prayer'],
  ['Learn', '/learn', 'more', 'study education'],
  ['Finance', '/finance', 'more', 'finances money budget'],
  ['Goals', '/goals', 'more', 'goals ambition'],
  ['Habits', '/habits', 'more', 'routine'],
  ['Health', '/health', 'more', 'wellness'],
  ['Journal', '/journal', 'more', 'reflect diary'],
  ['Morning', '/morning', 'more', 'daily briefing'],
  ['Crisis', '/crisis', 'more', 'support'],
  ['Settings', '/settings', 'account', 'account providers preferences'],
  ['Help', '/support', 'account', 'support help'],
].map(([title, path, group, keywords], index) => ({ id: path, title, path, group, keywords, primary: index < 7, type: 'page', text: `${title} ${keywords}` }));

export function resolvePageCommand(text) {
  const match = String(text || '').trim().match(/^(?:open|show|go to|take me to)(?:\s+my|\s+the)?\s+(.+?)[.!?]?$/i);
  if (!match) return null;
  const target = match[1].toLowerCase();
  return HEY_PAGES.find(page => page.title.toLowerCase() === target || page.keywords.split(' ').includes(target)) || null;
}
