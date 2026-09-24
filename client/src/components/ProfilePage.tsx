import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProfileEditor } from './Explore';
import { ProfileAvatar } from './ProfileAvatar';
import { SocialService, type ConversationStyle, type ExplorePost, type ProfileStats, type SocialProfile, type Visibility } from '../services/SocialService';

const social = new SocialService();

const styleLabels: Record<ConversationStyle, string> = {
  dengeli: 'Net ve dengeli',
  futbol: 'Futbol arkadaşı',
  basketbol: 'Takım oyuncusu',
  kitap: 'Düşünceli okur',
  girisimci: 'Girişim ortağı',
  sakin_koc: 'Sakin koç'
};

const visibilityLabels: Record<Visibility, string> = {
  public: 'Herkese açık',
  followers: 'Takipçilerim',
  private: 'Yalnızca ben'
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

export function ProfilePage({ userId, onStartChat, onStyleChange }: { userId: string; onStartChat: () => void; onStyleChange: (style: ConversationStyle) => void }) {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ postCount: 0, followerCount: 0, followingCount: 0 });
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextProfile, nextStats, nextPosts] = await Promise.all([
        social.profile(userId),
        social.profileStats(userId),
        social.profilePosts(userId)
      ]);
      setProfile(nextProfile);
      setStats(nextStats);
      setPosts(nextPosts);
      if (nextProfile) onStyleChange(nextProfile.conversation_style);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Profil şu anda yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [onStyleChange, userId]);

  useEffect(() => { void load(); }, [load]);

  const displayName = profile?.display_name || 'Nova Kullanıcısı';
  const joinedText = useMemo(() => 'NovaAI topluluğundasın', []);

  return <section className="profile-page" aria-label="Profilim">
    <div className="profile-page-head">
      <div><p className="eyebrow">NOVA PROFİL</p><h1>Profilim</h1><p>Kendini tanıt, tercihlerini düzenle ve topluluktaki paylaşımlarını yönet.</p></div>
      <button className="explore-chat-button" onClick={onStartChat}>Sohbete dön <span>→</span></button>
    </div>
    {error && <p className="social-error" role="alert">{error}<button onClick={() => void load()}>Yenile</button></p>}
    <div className="profile-hero">
      <div className="profile-identity">
        <ProfileAvatar className="profile-page-avatar" name={displayName} url={profile?.avatar_url} />
        <div className="profile-identity-copy"><h2>{displayName}</h2><p>@{profile?.username ?? 'nova'}</p></div>
        <button className="profile-primary-action" onClick={() => setEditorOpen(true)} disabled={!profile}>Profili düzenle</button>
      </div>
      <p className="profile-bio">{profile?.bio || 'Kısa bir biyografi ekleyerek topluluğun seni daha iyi tanımasını sağla.'}</p>
      <div className="profile-interest-row">{profile?.interests?.length ? profile.interests.map((interest) => <span key={interest}>{interest}</span>) : <span>İlgi alanlarını ekle</span>}</div>
      <div className="profile-stats" aria-label="Profil istatistikleri">
        <div><strong>{stats.postCount}</strong><span>Paylaşım</span></div>
        <div><strong>{stats.followerCount}</strong><span>Takipçi</span></div>
        <div><strong>{stats.followingCount}</strong><span>Takip edilen</span></div>
        <div><strong>{profile ? styleLabels[profile.conversation_style] : '—'}</strong><span>Nova’nın tonu</span></div>
      </div>
      <small className="profile-joined">{joinedText}</small>
    </div>
    <div className="profile-post-section">
      <div><h2>Paylaşımların</h2><p>Yalnızca senin görebildiğin içerikler de burada listelenir.</p></div>
      {loading ? <div className="feed-empty">Profil hazırlanıyor…</div> : posts.length ? <div className="profile-post-list">{posts.map((post) => <article className="profile-post" key={post.id}><div><span>{visibilityLabels[post.visibility]}</span><time dateTime={post.published_at}>{formatDate(post.published_at)}</time></div><p>{post.body}</p></article>)}</div> : <div className="feed-empty"><strong>Henüz paylaşımın yok.</strong><p>Keşfet alanından ilk fikrini toplulukla paylaşabilirsin.</p></div>}
    </div>
    {editorOpen && profile && <ProfileEditor profile={profile} onClose={() => setEditorOpen(false)} onSaved={(next) => { setProfile(next); onStyleChange(next.conversation_style); setEditorOpen(false); }} />}
  </section>;
}
