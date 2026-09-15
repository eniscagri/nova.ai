import { supabase } from './supabase';

export type ConversationStyle = 'dengeli' | 'futbol' | 'basketbol' | 'kitap' | 'girisimci' | 'sakin_koc';
export type Visibility = 'public' | 'followers' | 'private';

export type SocialProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  interests: string[];
  conversation_style: ConversationStyle;
  profile_visibility: Visibility;
};

export type ExplorePost = {
  id: string;
  author_id: string;
  body: string;
  visibility: Visibility;
  published_at: string;
  profiles: Pick<SocialProfile, 'username' | 'display_name'> | null;
  likeCount: number;
  likedByMe: boolean;
};

export type ProfileStats = {
  postCount: number;
  followerCount: number;
  followingCount: number;
};

const errorText = (message: string) => new Error(message || 'İşlem şu anda tamamlanamadı.');

export class SocialService {
  async profile(userId: string): Promise<SocialProfile | null> {
    const { data, error } = await supabase.from('profiles').select('id, username, display_name, bio, interests, conversation_style, profile_visibility').eq('id', userId).maybeSingle();
    if (error) throw errorText(error.message);
    return data as SocialProfile | null;
  }

  async saveProfile(profile: Pick<SocialProfile, 'id' | 'username' | 'display_name' | 'bio' | 'interests' | 'conversation_style' | 'profile_visibility'>): Promise<void> {
    const username = profile.username.trim().toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/[^a-z0-9_]/g, '');
    if (!/^[a-z0-9_]{3,24}$/.test(username)) throw new Error('Kullanıcı adı 3–24 karakter olmalı; yalnızca harf, rakam ve alt çizgi kullanabilirsin.');
    const { error } = await supabase.from('profiles').update({
      username,
      display_name: profile.display_name.trim().slice(0, 60),
      bio: profile.bio.trim().slice(0, 180),
      interests: profile.interests.slice(0, 8),
      conversation_style: profile.conversation_style,
      profile_visibility: profile.profile_visibility
    }).eq('id', profile.id);
    if (error) throw errorText(error.message);
  }

  async explore(userId: string): Promise<ExplorePost[]> {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, author_id, body, visibility, published_at, profiles!posts_author_id_fkey(username, display_name)')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(60);
    if (error) throw errorText(error.message);
    const raw = (posts ?? []) as unknown as Array<Omit<ExplorePost, 'likeCount' | 'likedByMe'>>;
    if (!raw.length) return [];
    const { data: blocks, error: blocksError } = await supabase.from('user_blocks').select('blocked_id').eq('blocker_id', userId);
    if (blocksError) throw errorText(blocksError.message);
    const blocked = new Set((blocks ?? []).map((block) => block.blocked_id));
    const visible = raw.filter((post) => !blocked.has(post.author_id));
    if (!visible.length) return [];
    const ids = visible.map((post) => post.id);
    const { data: likes, error: likesError } = await supabase.from('post_likes').select('post_id, user_id').in('post_id', ids);
    if (likesError) throw errorText(likesError.message);
    return visible.map((post) => {
      const postLikes = (likes ?? []).filter((like) => like.post_id === post.id);
      return { ...post, likeCount: postLikes.length, likedByMe: postLikes.some((like) => like.user_id === userId) };
    });
  }

  async profilePosts(userId: string): Promise<ExplorePost[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('id, author_id, body, visibility, published_at, profiles!posts_author_id_fkey(username, display_name)')
      .eq('author_id', userId)
      .order('published_at', { ascending: false })
      .limit(60);
    if (error) throw errorText(error.message);
    return ((data ?? []) as unknown as Array<Omit<ExplorePost, 'likeCount' | 'likedByMe'>>).map((post) => ({ ...post, likeCount: 0, likedByMe: false }));
  }

  async profileStats(userId: string): Promise<ProfileStats> {
    const [posts, followers, following] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
    ]);
    const failed = [posts, followers, following].find((result) => result.error);
    if (failed?.error) throw errorText(failed.error.message);
    return { postCount: posts.count ?? 0, followerCount: followers.count ?? 0, followingCount: following.count ?? 0 };
  }

  async publish(authorId: string, body: string, visibility: Visibility, sharedFromChat = false): Promise<void> {
    const { error } = await supabase.from('posts').insert({ author_id: authorId, body: body.trim().slice(0, 1800), visibility, shared_from_chat: sharedFromChat });
    if (error) throw errorText(error.message);
  }

  async toggleLike(post: ExplorePost, userId: string): Promise<void> {
    const request = post.likedByMe
      ? supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', userId)
      : supabase.from('post_likes').insert({ post_id: post.id, user_id: userId });
    const { error } = await request;
    if (error) throw errorText(error.message);
  }

  async isFollowing(viewerId: string, profileId: string): Promise<boolean> {
    const { data, error } = await supabase.from('follows').select('follower_id').eq('follower_id', viewerId).eq('following_id', profileId).maybeSingle();
    if (error) throw errorText(error.message);
    return Boolean(data);
  }

  async toggleFollow(viewerId: string, profileId: string, following: boolean): Promise<void> {
    const request = following
      ? supabase.from('follows').delete().eq('follower_id', viewerId).eq('following_id', profileId)
      : supabase.from('follows').insert({ follower_id: viewerId, following_id: profileId });
    const { error } = await request;
    if (error) throw errorText(error.message);
  }

  async reportPost(reporterId: string, postId: string): Promise<void> {
    const { error } = await supabase.from('reports').insert({ reporter_id: reporterId, post_id: postId, reason: 'diger', details: '' });
    if (error) throw errorText(error.message);
  }

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await supabase.from('user_blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
    if (error) throw errorText(error.message);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('author_id', userId);
    if (error) throw errorText(error.message);
  }
}
