import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// 定义频道数据结构
interface Channel {
  id: string;
  name: string;
  channelId: string;
  addedAt: string;
  playlistId: string;
  thumbnail?: string | null;
}

interface ChannelInDB {
  id: string;
  name: string;
  channelId: string;
  addedAt: string;
}

const CHANNELS_KEY = 'youtube_channels';

// 从数据库获取所有频道
async function getChannels(): Promise<ChannelInDB[]> {
  const channels = await kv.get<ChannelInDB[]>(CHANNELS_KEY);
  if (!channels) {
    // 如果数据库中没有数据，返回一个默认列表
    return [
      { id: '1', name: 'yan', channelId: 'UCzQUP1qoWOPGGMsc-ZfEj2A', addedAt: new Date().toISOString() },
      { id: '2', name: 'dk', channelId: 'UCiGm_E4gBFzKMg1c_H323XQ', addedAt: new Date().toISOString() },
    ];
  }
  return channels;
}

// 将频道列表存入数据库
async function saveChannels(channels: ChannelInDB[]): Promise<void> {
  await kv.set(CHANNELS_KEY, channels);
}

// 将频道ID转换为上传播放列表ID，并获取封面和标题
async function getPlaylistDetails(channelId: string): Promise<{ playlistId: string; thumbnail: string | null; title: string | null }> {
  if (channelId.startsWith('UC')) {
    const playlistId = 'UU' + channelId.substring(2);
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${playlistId}&format=json`);
      if (response.ok) {
        const data = await response.json();
        return { playlistId, thumbnail: data.thumbnail_url, title: data.title };
      }
    } catch (error) {
      console.error('Error fetching oEmbed data:', error);
    }
    return { playlistId, thumbnail: null, title: null };
  }
  // 对于非 UC 开头的 ID，可能本身就是播放列表 ID 或其他类型，暂不处理
  return { playlistId: channelId, thumbnail: null, title: null };
}


export async function GET() {
  try {
    const channelsFromDb = await getChannels();
    const channels: Channel[] = await Promise.all(
      channelsFromDb.map(async (channel) => {
        const { playlistId, thumbnail, title } = await getPlaylistDetails(channel.channelId);
        return {
          ...channel,
          name: title || channel.name, // 优先使用获取到的播放列表标题
          playlistId,
          thumbnail,
        };
      })
    );
    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error in GET /api/youtube-channels:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, channelId } = await req.json();

    if (!name || !channelId) {
      return NextResponse.json({ error: 'Missing name or channelId' }, { status: 400 });
    }

    const { playlistId, thumbnail, title } = await getPlaylistDetails(channelId);

    if (!playlistId) {
      return NextResponse.json({ error: 'Invalid channelId, could not determine playlistId' }, { status: 400 });
    }

    const channels = await getChannels();
    
    const newChannel: ChannelInDB = {
      id: Date.now().toString(),
      name: name || title, // 如果用户没有提供名称，则使用获取的标题
      channelId,
      addedAt: new Date().toISOString(),
    };

    const updatedChannels = [...channels, newChannel];
    await saveChannels(updatedChannels);

    // 返回完整的新频道信息，包括播放列表ID和封面
    const responseChannel: Channel = {
      ...newChannel,
      playlistId,
      thumbnail,
      name: title || newChannel.name,
    };

    return NextResponse.json(responseChannel, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/youtube-channels:', error);
    return NextResponse.json({ error: 'Failed to add channel' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing channel id' }, { status: 400 });
    }

    const channels = await getChannels();
    const updatedChannels = channels.filter((channel) => channel.id !== id);

    if (channels.length === updatedChannels.length) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    await saveChannels(updatedChannels);

    return NextResponse.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/youtube-channels:', error);
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
}