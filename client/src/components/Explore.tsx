import { useCallback, useEffect, useMemo, useState } from 'react';
import { SocialService, type ConversationStyle, type ExplorePost, type SocialProfile, type Visibility } from '../services/SocialService';

const social = new SocialService();
const styleOptions: Array<{ value: ConversationStyle; label: string; detail: string }> = [
  { value: 'dengeli', label: 'Dengeli', detail: 'Sade ve çok yönlü' },
  { value: 'futbol', label: 'Futbol tutkunu', detail: 'Spor benzetmeleriyle' },
  { value: 'basketbol', label: 'Basketbol tutkunu', detail: 'Takım ve oyun odaklı' },
  { value: 'kitap', label: 'Kitap kurdu', detail: 'Düşünceli ve meraklı' },
  { value: 'girisimci', label: 'Girişimci', detail: 'Fikirleri adımlara böler' },
  { value: 'sakin_koc', label: 'Sakin koç', detail: 'Destekleyici ve net' }
];

const visibilityText: Record<Visibility, string> = { public: 'Herkese açık', followers: 'Takipçilerim', private: 'Yalnızca ben' };

export function Explore({ userId, onStartChat, onStyleChange, sharedDraft, onShared }: { userId: string; onStartChat: () => void; onStyleChange: (style: ConversationStyle) => void; sharedDraft: string | null; onShared: () => void }) {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [postBody, setPostBody] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [profileOpen, setProfileOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextProfile, nextPosts] = await Promise.all([social.profile(userId), social.explore(userId)]);
      setProfile(nextProfile);
      setPosts(nextPosts);
      if (nextProfile) onStyleChange(nextProfile.conversation_style);
      const others = [...new Set(nextPosts.map((post) => post.author_id).filter((id) => id !== userId))];
      const statuses = await Promise.all(others.map(async (id) => [id, await social.isFollowing(userId, id)] as const));
      setFollowing(Object.fromEntries(statuses));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Keşfet alanı şu anda yüklenemedi.');
    } finally { setLoading(false); }
  }, [onStyleChange, userId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!sharedDraft) return;
    setPostBody(sharedDraft.slice(0, 1800));
    setVisibility('followers');
  }, [sharedDraft]);

  const publish = async () => {
    const text = postBody.trim();
    if (!text || busy) return;
    setBusy(true); setError('');
    try { await social.publish(userId, text, visibility, Boolean(sharedDraft)); setPostBody(''); onShared(); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Paylaşım yapılamadı.'); }
    finally { setBusy(false); }
  };

  const like = async (post: ExplorePost) => {
    setPosts((items) => items.map((item) => item.id === post.id ? { ...item, likedByMe: !item.likedByMe, likeCount: item.likeCount + (item.likedByMe ? -1 : 1) } : item));
    try { await social.toggleLike(post, userId); }
    catch { await load(); setError('Beğeni güncellenemedi.'); }
  };

  const follow = async (profileId: string) => {
    const wasFollowing = Boolean(following[profileId]);
    setFollowing((value) => ({ ...value, [profileId]: !wasFollowing }));
    try { await social.toggleFollow(userId, profileId, wasFollowing); }
    catch { setFollowing((value) => ({ ...value, [profileId]: wasFollowing })); setError('Takip durumu güncellenemedi.'); }
  };

  const removePost = async (post: ExplorePost) => {
    if (!confirm('Bu paylaşım silinsin mi?')) return;
    try { await social.deletePost(post.id, userId); setPosts((items) => items.filter((item) => item.id !== post.id)); }
    catch { setError('Paylaşım silinemedi.'); }
  };
  const report = async (post: ExplorePost) => {
    try { await social.reportPost(userId, post.id); setError('Bildirim alındı. İnceleme için kaydedildi.'); }
    catch { setError('Bildirim gönderilemedi.'); }
  };
  const block = async (post: ExplorePost) => {
    if (!confirm('Bu kullanıcıyı engellemek istiyor musun? Paylaşımları Keşfet alanında görünmeyecek.')) return;
    try { await social.blockUser(userId, post.author_id); setPosts((items) => items.filter((item) => item.author_id !== post.author_id)); }
    catch { setError('Kullanıcı engellenemedi.'); }
  };

  const selectedStyle = useMemo(() => styleOptions.find((option) => option.value === profile?.conversation_style) ?? styleOptions[0], [profile]);

  return <section className="explore-page" aria-label="Keşfet">
    <div className="explore-intro"><div><p className="eyebrow">NOVA TOPLULUĞU</p><h1>Keşfet</h1><p>Fikirlerini paylaş, ilham veren notları takip et.</p></div><button className="explore-chat-button" onClick={onStartChat}>Sohbete dön <span>→</span></button></div>
    {error && <p className="social-error" role="alert">{error}<button onClick={() => void load()}>Yenile</button></p>}
    <div className="explore-layout">
      <aside className="profile-card">
        <div className="profile-avatar">{profile?.display_name.slice(0, 1).toUpperCase() ?? 'N'}</div>
        <strong>{profile?.display_name ?? 'Profil hazırlanıyor'}</strong>
        <small>@{profile?.username ?? 'nova'}</small>
        <p>{profile?.bio || 'Fikirlerini ve ilgi alanlarını burada paylaş.'}</p>
        <div className="interest-list">{profile?.interests?.length ? profile.interests.map((interest) => <span key={interest}>{interest}</span>) : <span>Yeni başlangıç</span>}</div>
        <div className="style-preview"><small>Nova’nın sohbet tonu</small><strong>{selectedStyle.label}</strong><p>{selectedStyle.detail}</p></div>
        <button className="profile-edit" onClick={() => setProfileOpen(true)}>Profili düzenle</button>
      </aside>
      <div className="explore-feed">
        <section className="publish-card">
          <label htmlFor="post-body">Toplulukla bir fikir paylaş</label>
          <textarea id="post-body" value={postBody} onChange={(event) => setPostBody(event.target.value)} maxLength={1800} placeholder="Bugün düşündüğün bir şeyi yaz…" />
          <div><select aria-label="Paylaşım görünürlüğü" value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)}>{Object.entries(visibilityText).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><span>{postBody.length}/1800</span><button disabled={!postBody.trim() || busy} onClick={() => void publish()}>{busy ? 'Paylaşılıyor…' : 'Paylaş'}</button></div>
          <small>{sharedDraft ? 'Sohbetten seçtiğin bu metin yayınlanacak. Görünürlüğü değiştirebilirsin.' : 'Sohbetlerin burada otomatik görünmez. Yalnızca yazıp paylaştığın içerik yayınlanır.'}</small>
        </section>
        {loading ? <div className="feed-empty">Keşfet yükleniyor…</div> : posts.length ? posts.map((post) => <article className="post-card" key={post.id}>
          <div className="post-author"><div className="mini-avatar">{post.profiles?.display_name?.slice(0, 1).toUpperCase() ?? 'N'}</div><div><strong>{post.profiles?.display_name ?? 'Nova kullanıcısı'}</strong><small>@{post.profiles?.username ?? 'nova'} · {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(post.published_at))}</small></div>{post.author_id !== userId && <button onClick={() => void follow(post.author_id)}>{following[post.author_id] ? 'Takip ediliyor' : 'Takip et'}</button>}<details className="post-menu"><summary aria-label="Paylaşım seçenekleri">⋮</summary><div>{post.author_id === userId ? <button onClick={() => void removePost(post)}>Sil</button> : <><button onClick={() => void report(post)}>Bildir</button><button className="danger" onClick={() => void block(post)}>Engelle</button></>}</div></details></div>
          <p>{post.body}</p>
          <div className="post-actions"><button className={post.likedByMe ? 'liked' : ''} onClick={() => void like(post)} aria-label="Beğen">♥ <span>{post.likeCount || ''}</span></button><small>{visibilityText[post.visibility]}</small></div>
        </article>) : <div className="feed-empty"><strong>İlk fikri sen paylaş.</strong><p>Topluluk akışı henüz yeni. Kısa bir notla başlayabilirsin.</p></div>}
      </div>
    </div>
    {profileOpen && profile && <ProfileEditor profile={profile} onClose={() => setProfileOpen(false)} onSaved={(next) => { setProfile(next); onStyleChange(next.conversation_style); setProfileOpen(false); }} />}
  </section>;
}

export function ProfileEditor({ profile, onClose, onSaved }: { profile: SocialProfile; onClose: () => void; onSaved: (profile: SocialProfile) => void }) {
  const [name, setName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [interests, setInterests] = useState(profile.interests.join(', '));
  const [style, setStyle] = useState<ConversationStyle>(profile.conversation_style);
  const [visibility, setVisibility] = useState<Visibility>(profile.profile_visibility);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    const next = { ...profile, username: username.trim().toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/[^a-z0-9_]/g, ''), display_name: name.trim(), bio: bio.trim(), interests: interests.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 8), conversation_style: style, profile_visibility: visibility };
    try { await social.saveProfile(next); onSaved(next); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Profil güncellenemedi.'); }
    finally { setBusy(false); }
  };
  return <div className="modal-backdrop"><form className="profile-editor" onSubmit={save} aria-label="Profilini düzenle"><header><div><p className="eyebrow">NOVA PROFİL</p><h2>Profilini düzenle</h2></div><button type="button" onClick={onClose} aria-label="Kapat">×</button></header><label>Görünen ad<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={60} required /></label><label>Kullanıcı adı<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/[^a-z0-9_]/g, ''))} minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" required /><small>@{username || 'kullanici_adi'} olarak görünür</small></label><label>Biyografi<textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={180} placeholder="Kendinden kısaca bahset" /></label><label>İlgi alanları <small>Virgülle ayır</small><input value={interests} onChange={(event) => setInterests(event.target.value)} maxLength={180} placeholder="Tasarım, futbol, girişim" /></label><label>Nova’nın sohbet tonu<select value={style} onChange={(event) => setStyle(event.target.value as ConversationStyle)}>{styleOptions.map((option) => <option key={option.value} value={option.value}>{option.label} — {option.detail}</option>)}</select></label><label>Profil görünürlüğü<select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)}>{Object.entries(visibilityText).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>{error && <p className="auth-error">{error}</p>}<footer><button type="button" onClick={onClose}>Vazgeç</button><button disabled={busy}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button></footer></form></div>;
}
