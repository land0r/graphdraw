/*
 * Icons for diagrams, from the packs a site registered (see `IconPacks`):
 * Iconify JSON files, fetched by URL only for a diagram that names one of
 * their icons. The module holds no icons itself.
 *
 * Icon markup comes from a pack and nowhere else: the name a diagram writes
 * only picks an icon, and is never put into markup.
 */

// Font Awesome's class names, as Mermaid.js reads them: `fa:fa-car` is the
// icon `car` of the pack `fa`.
const FONT_AWESOME = /^(fa[bklrs]?):fa-(.+)$/;

// Any other name: `fa:user` is the icon `user` of the pack `fa`.
const PACK_ICON = /^([a-z0-9-]+):([^:]+)$/;

/**
 * Tells which pack and which icon a name written in a diagram means.
 *
 * @param {string} name The name: `fa:fa-car`, `fab:fa-github`, `fa:user`,
 *                      `logos:aws`. A built-in symbol such as `database` has
 *                      no pack.
 *
 * @return {?{pack: string, icon: string}} The pack and the icon, or null.
 */
export function parseIconName( name ) {
	const match = FONT_AWESOME.exec( name ) || PACK_ICON.exec( name );

	return match ? { pack: match[ 1 ], icon: match[ 2 ] } : null;
}

const hasOwn = ( object, key ) =>
	!! object &&
	typeof object === 'object' &&
	Object.prototype.hasOwnProperty.call( object, key );

/**
 * Finds an icon in a pack: one of its icons, or an alias of one.
 *
 * @param {Object} pack The Iconify JSON of the pack.
 * @param {string} icon The name of the icon in the pack.
 *
 * @return {?Object} The icon's data, with an alias's own values over its
 * parent's, or null. An alias of another alias is not followed.
 */
function findIcon( pack, icon ) {
	if ( hasOwn( pack.icons, icon ) ) {
		return pack.icons[ icon ];
	}

	if ( hasOwn( pack.aliases, icon ) ) {
		const alias = pack.aliases[ icon ];

		if ( hasOwn( pack.icons, alias.parent ) ) {
			return { ...pack.icons[ alias.parent ], ...alias };
		}
	}

	return null;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

// What can run code in an SVG: these elements, with what they hold.
const UNSAFE_ELEMENTS = [
	'script',
	'foreignobject',
	'iframe',
	'embed',
	'object',
];

// What an animation may not change: a link, or an event handler.
const UNSAFE_TARGET = /^(?:(?:xlink:)?href|on.*)$/i;

// The links an icon may have: to one of its own parts, or to an image's data.
const SAFE_LINK = /^\s*(?:#|data:image\/)/i;

/**
 * Removes from the markup of an icon what can run code, and keeps the drawing.
 *
 * A pack is a file a site fetches from elsewhere, so its markup is not
 * trusted: scripts, HTML, event handlers, links that aren't to a part of the
 * icon and animations that set links or handlers are dropped. Real icons have
 * none of them, so they come out as they are. Mermaid.js cleans the icons it
 * draws itself, with DOMPurify.
 *
 * @param {string} body The markup of the icon, without its SVG element.
 *
 * @return {?string} The markup, without what can run code, or null when it is
 * not XML, as Iconify's markup always is.
 */
function cleanBody( body ) {
	// An inert document: nothing in it loads or runs.
	const doc = new window.DOMParser().parseFromString(
		`<svg xmlns="${ SVG_NS }" xmlns:xlink="${ XLINK_NS }">${ body }</svg>`,
		'image/svg+xml'
	);
	const svg = doc.documentElement;

	if ( svg.localName !== 'svg' || doc.querySelector( 'parsererror' ) ) {
		return null;
	}

	for ( const element of [ ...svg.querySelectorAll( '*' ) ] ) {
		const name = element.localName.toLowerCase();
		const isAnimation = name === 'set' || name.startsWith( 'animate' );

		if (
			UNSAFE_ELEMENTS.includes( name ) ||
			( isAnimation &&
				UNSAFE_TARGET.test( element.getAttribute( 'attributeName' ) ) )
		) {
			element.remove();
			continue;
		}

		for ( const { name: attribute, value } of [ ...element.attributes ] ) {
			const isLink = /^(?:xlink:)?href$/i.test( attribute );

			if (
				/^on/i.test( attribute ) ||
				( isLink && ! SAFE_LINK.test( value ) )
			) {
				element.removeAttribute( attribute );
			}
		}
	}

	// The children, as XML: an empty icon serializes as `<svg …/>`.
	return new window.XMLSerializer()
		.serializeToString( svg )
		.replace( /^<svg[^>]*?(?:\/>|>)/, '' )
		.replace( /<\/svg>$/, '' );
}

// The cleaned markup of each icon drawn on this page, by its markup.
const cleaned = new Map();

/**
 * Builds the SVG of an icon from the Iconify JSON of its pack.
 *
 * The box is the icon's `left`, `top`, `width` and `height`, each from the
 * icon, else the pack, else 16 (0 for `left` and `top`). The SVG fills the
 * box it is put in, in the colour of the text around it unless the icon
 * paints itself, like a logo. The icon's markup is cleaned first
 * (`cleanBody()`), once per page.
 *
 * @param {?Object} pack The Iconify JSON of the pack.
 * @param {string}  icon The name of the icon in the pack.
 *
 * @return {?string} The SVG markup, or null when the pack has no such icon,
 * or its markup is not XML.
 */
export function getIconSvg( pack, icon ) {
	const data =
		pack && hasOwn( pack, 'icons' ) ? findIcon( pack, icon ) : null;

	if ( ! data || typeof data.body !== 'string' ) {
		return null;
	}

	const get = ( key, fallback ) => {
		const value = [ data[ key ], pack[ key ] ].find( Number.isFinite );

		return value ?? fallback;
	};
	const box = [
		get( 'left', 0 ),
		get( 'top', 0 ),
		get( 'width', 16 ),
		get( 'height', 16 ),
	].join( ' ' );

	if ( ! cleaned.has( data.body ) ) {
		cleaned.set( data.body, cleanBody( data.body ) );
	}

	const body = cleaned.get( data.body );

	return body === null
		? null
		: `<svg xmlns="${ SVG_NS }" viewBox="${ box }" width="100%" height="100%" fill="currentColor" stroke="none">${ body }</svg>`;
}

// The packs fetched on this page, by URL: a promise of the Iconify JSON, or of
// null when it could not be had. A pack is fetched once, whoever asks.
const fetched = new Map();

/**
 * Fetches the Iconify JSON of a pack, once per page.
 *
 * @param {string} url The URL of the file.
 *
 * @return {Promise<?Object>} The file's data, or null when it could not be
 * fetched or read. That is logged once. Never rejects.
 */
export function loadPack( url ) {
	if ( ! fetched.has( url ) ) {
		fetched.set(
			url,
			Promise.resolve()
				.then( () => fetch( url ) )
				.then( ( response ) => {
					if ( ! response.ok ) {
						throw new Error( `HTTP ${ response.status }` );
					}

					return response.json();
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error(
						`GraphDraw: failed to load the icon pack ${ url }.`,
						error
					);

					return null;
				} )
		);
	}

	return fetched.get( url );
}

/**
 * Makes the icons of the site's packs available to a renderer.
 *
 * @param {Object<string, string>} packs The URL of the Iconify JSON of each
 *                                       pack, by name: see `IconPacks`.
 *
 * @return {{get: Function, hasUnloaded: Function, load: Function}} `get( name )`
 * returns the SVG of an icon whose pack is loaded, or null; `hasUnloaded( names )`
 * tells whether one of the names is in a pack that is not loaded yet; `load( names )`
 * loads those packs, and resolves once they have loaded or failed.
 */
export function createIcons( packs ) {
	// The Iconify JSON of each pack that is loaded, or null for one that failed.
	const loaded = new Map();

	const getUnloaded = ( names ) => {
		const unloaded = new Set();

		for ( const name of names ) {
			const parsed = parseIconName( name );

			if (
				parsed &&
				hasOwn( packs, parsed.pack ) &&
				! loaded.has( parsed.pack )
			) {
				unloaded.add( parsed.pack );
			}
		}

		return unloaded;
	};

	return {
		get( name ) {
			const parsed = parseIconName( name );

			return parsed && loaded.has( parsed.pack )
				? getIconSvg( loaded.get( parsed.pack ), parsed.icon )
				: null;
		},

		hasUnloaded: ( names ) => getUnloaded( names ).size > 0,

		async load( names ) {
			await Promise.all(
				[ ...getUnloaded( names ) ].map( async ( pack ) => {
					loaded.set( pack, await loadPack( packs[ pack ] ) );
				} )
			);
		},
	};
}
