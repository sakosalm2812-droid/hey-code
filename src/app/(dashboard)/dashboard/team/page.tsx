'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Mail, 
  Shield, 
  Settings, 
  Trash2, 
  UserCheck, 
  UserX,
  Loader2,
  Building2,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  plan: string;
  ownerId: string;
  owner: { id: string; name: string | null; email: string; image: string | null };
  _count: { members: number };
}

interface TeamMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface Invitation {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSlug, setNewTeamSlug] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (res.ok) {
        setTeams(data.teams);
        if (data.teams.length > 0 && !activeTeam) {
          setActiveTeam(data.teams[0]);
        }
      }
    } catch {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async (teamId: string) => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`/api/team/members?teamId=${teamId}`),
        fetch(`/api/team/invitations?teamId=${teamId}`),
      ]);
      const membersData = await membersRes.json();
      const invitesData = await invitesRes.json();
      if (membersRes.ok) setMembers(membersData.members);
      if (invitesRes.ok) setInvitations(invitesData.invitations);
    } catch {
      toast.error('Failed to load team data');
    }
  };

  useEffect(() => {
    if (activeTeam) {
      fetchTeamData(activeTeam.id);
    } else {
      setMembers([]);
      setInvitations([]);
    }
  }, [activeTeam]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !newTeamSlug.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName, slug: newTeamSlug, description: newTeamDesc }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Team created!');
        setTeams(prev => [...prev, data.team]);
        setActiveTeam(data.team);
        setShowCreateDialog(false);
        setNewTeamName('');
        setNewTeamSlug('');
        setNewTeamDesc('');
      } else {
        toast.error(data.error || 'Failed to create team');
      }
    } catch {
      toast.error('Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!activeTeam || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/team/invitations?teamId=${activeTeam.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Invitation sent!');
        setInvitations(prev => [data.invitation, ...prev]);
        setShowInviteDialog(false);
        setInviteEmail('');
      } else {
        toast.error(data.error || 'Failed to send invitation');
      }
    } catch {
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: 'ADMIN' | 'MEMBER') => {
    if (!activeTeam) return;
    try {
      const res = await fetch(`/api/team/members?teamId=${activeTeam.id}&memberId=${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
        toast.success('Role updated');
      } else {
        toast.error('Failed to update role');
      }
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeTeam) return;
    if (!confirm('Remove this member from the team?')) return;
    try {
      const res = await fetch(`/api/team/members?teamId=${activeTeam.id}&memberId=${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        toast.success('Member removed');
      } else {
        toast.error('Failed to remove member');
      }
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const isOwner = (member: TeamMember) => member.role === 'OWNER';
  const currentUserIsOwner = activeTeam?.ownerId === session?.user?.id;
  const currentUserIsAdmin = members.find(m => m.user.id === session?.user?.id)?.role === 'ADMIN';
  const canManage = currentUserIsOwner || currentUserIsAdmin;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Workspace</h1>
            <p className="text-muted-foreground mt-1">Manage your team, members, and invitations</p>
          </div>
          {teams.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Switch Team:</label>
              <select
                value={activeTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  if (team) setActiveTeam(team);
                }}
                className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input id="team-name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Acme Inc" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-slug">Slug (URL)</Label>
                  <Input id="team-slug" value={newTeamSlug} onChange={(e) => setNewTeamSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="acme-inc" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-desc">Description (optional)</Label>
                  <Input id="team-desc" value={newTeamDesc} onChange={(e) => setNewTeamDesc(e.target.value)} placeholder="Team description" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateTeam} loading={creating}>Create Team</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {teams.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No teams yet</h3>
              <p className="text-muted-foreground mb-6">Create your first team workspace to collaborate with others</p>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Team
              </Button>
            </CardContent>
          </Card>
        ) : activeTeam ? (
          <Tabs defaultValue="members" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="members">
                <Users className="h-4 w-4 mr-2" />
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="invitations">
                <Mail className="h-4 w-4 mr-2" />
                Invitations ({invitations.filter(i => !i.acceptedAt).length})
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                  {canManage && (
                    <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                      <DialogTrigger asChild>
                        <Button className="gap-2" size="sm">
                          <Mail className="h-4 w-4" />
                          Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="invite-email">Email</Label>
                            <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" />
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2">
                                <input type="radio" name="invite-role" value="ADMIN" checked={inviteRole === 'ADMIN'} onChange={() => setInviteRole('ADMIN')} />
                                <span>Admin</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input type="radio" name="invite-role" value="MEMBER" checked={inviteRole === 'MEMBER'} onChange={() => setInviteRole('MEMBER')} />
                                <span>Member</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
                          <Button onClick={handleInvite} loading={inviting}>Send Invitation</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {member.user.image ? (
                              <img src={member.user.image} alt="" className="h-10 w-10 rounded-full" />
                            ) : (
                              <span className="font-medium text-primary">{member.user.name?.charAt(0).toUpperCase() || member.user.email.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{member.user.name || 'Unnamed'}</p>
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as 'ADMIN' | 'MEMBER')}
                            disabled={isOwner(member) || !canManage || member.user.id === session?.user?.id}
                            className="px-2 py-1 text-sm border rounded"
                          >
                            <option value="OWNER" disabled>Owner</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Member</option>
                          </select>
                          {canManage && !isOwner(member) && member.user.id !== session?.user?.id && (
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveMember(member.id)}>
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                          {isOwner(member) && <span title="Owner" aria-label="Owner"><Shield className="h-4 w-4 text-primary" /></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invitations">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Pending Invitations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invitations.filter(i => !i.acceptedAt).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending invitations</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invitations.filter(i => !i.acceptedAt).map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{invite.email}</p>
                              <p className="text-sm text-muted-foreground">
                                {invite.role} · Expires {new Date(invite.expiresAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                        </div>
                      ))}
                      {invitations.filter(i => i.acceptedAt).length > 0 && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-3">Accepted</h4>
                          <div className="space-y-2">
                            {invitations.filter(i => i.acceptedAt).map((invite) => (
                              <div key={invite.id} className="flex items-center justify-between p-2 text-sm text-muted-foreground">
                                <span>{invite.email} · {invite.role}</span>
                                <span>Accepted {new Date(invite.acceptedAt!).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Team Settings
                  </CardTitle>
                  <CardDescription>Manage team configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Basic Information</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="team-name-edit">Team Name</Label>
                        <Input id="team-name-edit" defaultValue={activeTeam.name} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="team-slug-edit">Slug</Label>
                        <Input id="team-slug-edit" defaultValue={activeTeam.slug} disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-desc-edit">Description</Label>
                      <Input id="team-desc-edit" defaultValue={activeTeam.description || ''} disabled />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Plan</h4>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="font-medium capitalize">{activeTeam.plan} Plan</p>
                      <p className="text-sm text-muted-foreground mt-1">Team workspaces include unlimited members, shared chats, and admin controls.</p>
                    </div>
                  </div>

                  {currentUserIsOwner && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-destructive">Danger Zone</h4>
                      <p className="text-sm text-muted-foreground mb-4">Deleting the team is permanent and cannot be undone.</p>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Team
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    );
}