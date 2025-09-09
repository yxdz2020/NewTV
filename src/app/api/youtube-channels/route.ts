import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/db';

// DBに保存されるデータの型
interface StoredYouTubeChannel {
  id: string;
  name: string;
  channelId: string;
  addedAt: string;
}

// APIが返すデータの型
interface ApiYouTubeChannel extends StoredYouTubeChannel {
  thumbnail?: string | null;
  playlistId: string;
}

// チャンネルIDをアップロード再生リストIDに変換し、カバーとタイトルを取得する
async function getPlaylistDetails(channelId: string): Promise<{ playlistId: string; thumbnail: string | null; title: string | null }> {
  if (channelId.startsWith('UC')) {
    const playlistId = 'UU' + channelId.substring(2);
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${playlistId}&format=json`);
      if (response.ok) {
        const data = await response.json();
        return { playlistId, thumbnail: data.thumbnail_url, title: data.author_name }; // oEmbedのauthor_nameをタイトルとして使用
      }
    } catch (error) {
      console.error('Error fetching oEmbed data:', error);
    }
    return { playlistId, thumbnail: null, title: null };
  }
  return { playlistId: channelId, thumbnail: null, title: null };
}

async function getStoredChannels(): Promise<StoredYouTubeChannel[]> {
  const storage = getStorage();
  if (!storage) {
    // DBが設定されていない場合、デフォルトリストを返す
    return [
      { id: '1', name: 'yan', channelId: 'UCzQUP1qoWOPGGMsc-ZfEj2A', addedAt: new Date().toISOString() },
      { id: '2', name: 'dk', channelId: 'UCiGm_E4gBFzKMg1c_H323XQ', addedAt: new Date().toISOString() },
    ];
  }
  const adminConfig = await (storage as any).getAdminConfig();
  return adminConfig?.YouTubeChannels || [];
}

async function saveChannels(channels: StoredYouTubeChannel[]): Promise<void> {
  const storage = getStorage();
  if (!storage) {
    throw new Error('データベースストレージが利用できません');
  }
  const adminConfig = await (storage as any).getAdminConfig() || {};
  adminConfig.YouTubeChannels = channels;
  await (storage as any).setAdminConfig(adminConfig);
}

export async function GET() {
  try {
    const storedChannels = await getStoredChannels();
    const channels: ApiYouTubeChannel[] = await Promise.all(
      storedChannels.map(async (channel) => {
        const { playlistId, thumbnail, title } = await getPlaylistDetails(channel.channelId);
        return {
          ...channel,
          name: title || channel.name, // oEmbedのタイトルを優先
          playlistId,
          thumbnail,
        };
      })
    );
    return NextResponse.json(channels);
  } catch (error) {
    console.error('GET /api/youtube-channels でエラー:', error);
    return NextResponse.json({ error: 'チャンネルの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, channelId } = await req.json();

    if (!name || !channelId) {
      return NextResponse.json({ error: '名前またはチャンネルIDがありません' }, { status: 400 });
    }

    const { playlistId, thumbnail, title } = await getPlaylistDetails(channelId);

    if (!playlistId) {
      return NextResponse.json({ error: '無効なチャンネルIDです。再生リストIDを特定できませんでした' }, { status: 400 });
    }

    const channels = await getStoredChannels();
    
    const newChannel: StoredYouTubeChannel = {
      id: Date.now().toString(),
      name: name || title, // ユーザーが名前を指定しない場合は取得したタイトルを使用
      channelId,
      addedAt: new Date().toISOString(),
    };

    const updatedChannels = [...channels, newChannel];
    await saveChannels(updatedChannels);

    const responseChannel: ApiYouTubeChannel = {
      ...newChannel,
      playlistId,
      thumbnail,
      name: title || newChannel.name,
    };

    return NextResponse.json(responseChannel, { status: 201 });
  } catch (error) {
    console.error('POST /api/youtube-channels でエラー:', error);
    return NextResponse.json({ error: 'チャンネルの追加に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'チャンネルIDがありません' }, { status: 400 });
    }

    const channels = await getStoredChannels();
    const updatedChannels = channels.filter((channel) => channel.id !== id);

    if (channels.length === updatedChannels.length) {
      return NextResponse.json({ error: 'チャンネルが見つかりません' }, { status: 404 });
    }

    await saveChannels(updatedChannels);

    return NextResponse.json({ message: 'チャンネルが正常に削除されました' });
  } catch (error) {
    console.error('DELETE /api/youtube-channels でエラー:', error);
    return NextResponse.json({ error: 'チャンネルの削除に失敗しました' }, { status: 500 });
  }
}