interface User {
	external_urls: ExternalURLs;
	followers: Followers;
	href: string;
	id: string;
	type: string;
	uri: string;
	display_name: string;
}

export interface Me extends User {
	country: string;
	email: string;
	explicit_content: {
		filter_enabled: boolean;
		filter_locked: boolean;
	};
	images: Image[];
	product: string;
}

export interface Playlists {
	href: string;
	limit: number;
	next: string;
	offset: number;
	previous: string;
	total: number;
	items: Playlist[];
}

export interface Playlist {
	collaborative: boolean;
	description: string;
	external_urls: ExternalURLs;
	followers: Followers;
	href: string;
	id: string;
	images: Image[];
	name: string;
	owner: User;
	public: boolean;
	snapshot_id: string;
	tracks: Tracks;
	type: string;
	uri: string;
}

interface Followers {
	href: string;
	total: number;
}

interface Image {
	url: string;
	height: number;
	width: number;
}

interface ExternalURLs {
	spotify: string;
}

interface Tracks {
	href: string;
	limit: number;
	next: string;
	offset: number;
	previous: string;
	total: number;
	items: {
		added_at: string;
		added_by: User;
		is_local: boolean;
		track: Track;
	}[];
}

export interface Track {
	album: Album;
	artists: ExtendedArtist[];
	available_markets: string[];
	disc_number: number;
	duration_ms: number;
	explicit: boolean;
	external_ids: ExternalIDs;
	external_urls: ExternalURLs;
	href: string;
	id: string;
	is_playable: boolean;
	linked_from: never;
	restrictions: Restrictions;
	name: string;
	popularity: number;
	preview_url: string;
	track_number: number;
	type: string;
	uri: string;
	is_local: boolean;
}

interface Album {
	album_type: string;
	total_tracks: number;
	available_markets: string[];
	external_urls: ExternalURLs;
	href: string;
	id: string;
	images: Image[];
	name: string;
	release_date: string;
	release_date_precision: string;
	restrictions: Restrictions;
	type: string;
	uri: string;
	copyrights: Copyright[];
	external_ids: ExternalIDs;
	genres: string[];
	label: string;
	popularity: number;
	album_group: string;
	artists: Artist[];
}

interface Artist {
	external_urls: ExternalURLs;
	href: string;
	id: string;
	name: string;
	type: string;
	uri: string;
}

interface ExtendedArtist extends Artist {
	followers: Followers;
	genres: string[];
	images: Image[];
	popularity: number;
}

interface ExternalIDs {
	isrc: string;
	ean: string;
	upc: string;
}

interface Copyright {
	text: string;
	type: string;
}

interface Restrictions {
	reason: string;
}

export interface SavedTracks {
	href: string;
	limit: number;
	next: string;
	offset: number;
	previous: string;
	total: number;
	items: {
		added_at: string;
		track: Track;
	}[];
}
