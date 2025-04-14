import axios from 'axios';
import { getDominantColor, imageToBase64 } from '../helpers';
import { Song } from '../types';

export async function getSongData(username: string, apiKey: string, defaultImage: string): Promise<Song> {
	const params = {
		method: 'user.getrecenttracks',
		user: username,
		api_key: apiKey,
		limit: '1',
		format: 'json',
	};

	const { data, status } = await axios.get(`https://ws.audioscrobbler.com/2.0/?${new URLSearchParams(params).toString()}`, {
		validateStatus: () => true,
	});

	if (status != 200) {
		return {
			name: data?.message,
			url: 'https://www.last.fm/api/show/user.getRecentTracks',
			artist: 'Error Occured',
			image: await imageToBase64(defaultImage),
			dominantColor: 'd51007',
		};
	}

	const track = data?.recenttracks?.track?.[0];
	const image = track?.image?.[3]?.['#text'];
	const isDefaultImage = image === 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' || !image;
	const base64Image = await imageToBase64(isDefaultImage ? defaultImage : image);
	const dominantColor = isDefaultImage ? 'd51007' : await getDominantColor(base64Image);

	return {
		name: track?.name || 'Unknown Song',
		artist: track?.artist?.['#text'] || 'Unknown Artist',
		url: track?.url || 'https://www.last.fm',
		image: base64Image,
		dominantColor,
	};
}
