import { createIcons, getIconSvg, parseIconName } from '../icons';

describe( 'parseIconName()', () => {
	it.each( [
		[ 'fa:fa-car', { pack: 'fa', icon: 'car' } ],
		[ 'fab:fa-github', { pack: 'fab', icon: 'github' } ],
		[ 'far:fa-user', { pack: 'far', icon: 'user' } ],
		[ 'fa:user', { pack: 'fa', icon: 'user' } ],
		[ 'logos:aws', { pack: 'logos', icon: 'aws' } ],
		[ 'logos:aws-lambda', { pack: 'logos', icon: 'aws-lambda' } ],
	] )( 'reads %s', ( name, expected ) => {
		expect( parseIconName( name ) ).toEqual( expected );
	} );

	it.each( [ 'database', 'server', '', ':x', 'fa:', 'a:b:c', 'Fa:car' ] )(
		'finds no pack in "%s"',
		( name ) => {
			expect( parseIconName( name ) ).toBeNull();
		}
	);
} );

describe( 'getIconSvg()', () => {
	const pack = {
		prefix: 'p',
		width: 640,
		height: 512,
		icons: {
			car: { body: '<path d="M0 0"/>' },
			wide: { body: '<g/>', width: 32, left: 2 },
			plain: { body: '<rect/>', width: 24, height: 24, top: 1 },
		},
		aliases: {
			auto: { parent: 'car' },
			tall: { parent: 'wide', height: 48 },
			orphan: { parent: 'nowhere' },
			chain: { parent: 'auto' },
		},
	};
	const svg = ( box, body ) =>
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ box }" width="100%" height="100%" fill="currentColor" stroke="none">${ body }</svg>`;

	it( 'uses the size of the pack for an icon with none', () => {
		expect( getIconSvg( pack, 'car' ) ).toBe(
			svg( '0 0 640 512', '<path d="M0 0"/>' )
		);
	} );

	it( 'lets an icon override width, height, left and top', () => {
		expect( getIconSvg( pack, 'wide' ) ).toBe(
			svg( '2 0 32 512', '<g/>' )
		);
		expect( getIconSvg( pack, 'plain' ) ).toBe(
			svg( '0 1 24 24', '<rect/>' )
		);
	} );

	it( 'uses 16 by 16 when neither the icon nor the pack has a size', () => {
		expect( getIconSvg( { icons: { a: { body: '<i/>' } } }, 'a' ) ).toBe(
			svg( '0 0 16 16', '<i/>' )
		);
	} );

	it( 'follows an alias to its parent, which it may override', () => {
		expect( getIconSvg( pack, 'auto' ) ).toBe( getIconSvg( pack, 'car' ) );
		expect( getIconSvg( pack, 'tall' ) ).toBe( svg( '2 0 32 48', '<g/>' ) );
	} );

	it.each( [ 'missing', 'orphan', 'chain', '__proto__', 'constructor' ] )(
		'returns null for %s',
		( icon ) => {
			expect( getIconSvg( pack, icon ) ).toBeNull();
		}
	);

	it( 'returns null for a file that is no icon set', () => {
		expect( getIconSvg( null, 'car' ) ).toBeNull();
		expect( getIconSvg( { icons: 'x' }, 'car' ) ).toBeNull();
		expect( getIconSvg( { icons: { a: {} } }, 'a' ) ).toBeNull();
	} );

	const body = ( markup ) =>
		getIconSvg( { icons: { a: { body: markup } } }, 'a' )
			.replace( /^<svg[^>]*>/, '' )
			.replace( /<\/svg>$/, '' );

	it( 'keeps the drawing of real icons as it is', () => {
		// Font Awesome's car, a gradient logo and an animated spinner, as Iconify has them.
		const icons = [
			'<path fill="currentColor" d="M135.2 117.4L109.1 192h293.8l-26.1-74.6C372.3 104.6 360.2 96 346.6 96H165.4c-13.6 0-25.7 8.6-30.2 21.4z"/>',
			'<defs><linearGradient id="a" x1="0%" x2="100%"><stop offset="0%" stop-color="#41D1FF"/><stop offset="100%" stop-color="#BD34FE"/></linearGradient></defs><path fill="url(#a)" d="M255.2 37.3L134.8 252.9"/><use href="#a"/><use xlink:href="#a"/>',
			'<circle cx="12" cy="12" r="0"><animate attributeName="r" dur="1.2s" repeatCount="indefinite" values="0;11"/></circle>',
			'<image href="data:image/png;base64,iVBORw0KGgo=" width="16" height="16"/>',
		];

		for ( const icon of icons ) {
			expect( body( icon ) ).toBe( icon );
		}
	} );

	it.each( [
		[ 'a script', '<path d="M0 0"/><script>alert(1)</script>' ],
		[
			'HTML in a foreignObject',
			'<path d="M0 0"/><foreignObject><img xmlns="http://www.w3.org/1999/xhtml" src="x" onerror="alert(1)"/></foreignObject>',
		],
		[
			'an event handler',
			'<path d="M0 0" onload="alert(1)" onClick="alert(1)"/>',
		],
		[
			'a javascript: link',
			'<a href="javascript:alert(1)"><path d="M0 0"/></a>',
		],
		[
			'an xlink:href to elsewhere',
			'<use xlink:href="https://example.com/x.svg#a"/><path d="M0 0"/>',
		],
		[
			'an animation that sets a link',
			'<a><set attributeName="href" to="javascript:alert(1)"/><path d="M0 0"/></a>',
		],
		[
			'an animation that sets a handler',
			'<path d="M0 0"/><animate attributeName="onbegin" values="alert(1)"/>',
		],
	] )( 'removes %s', ( name, markup ) => {
		const cleaned = body( markup );

		expect( cleaned ).toContain( '<path d="M0 0"/>' );
		expect( cleaned ).not.toMatch(
			/script|foreignObject|onload|onclick|onerror|javascript:|example\.com|<set|<animate/i
		);
	} );

	it( 'returns null for markup that is not XML', () => {
		expect(
			getIconSvg( { icons: { a: { body: '<path d="M0 0">' } } }, 'a' )
		).toBeNull();
	} );
} );

describe( 'createIcons()', () => {
	const fa = { prefix: 'fa', icons: { car: { body: '<path/>' } } };
	let n = 0;

	const respond = ( data, ok = true ) =>
		Promise.resolve( { ok, json: () => Promise.resolve( data ) } );

	beforeEach( () => {
		n++;
		global.fetch = jest.fn( () => respond( fa ) );
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
		delete global.fetch;
	} );

	it( 'knows nothing of an icon before its pack is loaded', () => {
		const icons = createIcons( { fa: `/fa-${ n }.json` } );

		expect( icons.get( 'fa:fa-car' ) ).toBeNull();
		expect( global.fetch ).not.toHaveBeenCalled();
	} );

	it( 'asks to load only the packs that names point at', () => {
		const icons = createIcons( { fa: `/fa-${ n }.json` } );

		expect( icons.hasUnloaded( [ 'database', 'server' ] ) ).toBe( false );
		expect( icons.hasUnloaded( [ 'other:car' ] ) ).toBe( false );
		expect( icons.hasUnloaded( [ 'database', 'fa:fa-car' ] ) ).toBe( true );
	} );

	it( 'gives the SVG of an icon once its pack is loaded', async () => {
		const icons = createIcons( { fa: `/fa-${ n }.json` } );

		await icons.load( [ 'fa:fa-car' ] );

		expect( icons.get( 'fa:fa-car' ) ).toContain( '<path/>' );
		expect( icons.get( 'fa:truck' ) ).toBeNull();
		expect( icons.hasUnloaded( [ 'fa:fa-car' ] ) ).toBe( false );
	} );

	it( 'fetches a pack once, for any number of icons and users', async () => {
		const url = `/fa-${ n }.json`;
		const one = createIcons( { fa: url } );
		const two = createIcons( { fa: url } );

		await Promise.all( [
			one.load( [ 'fa:fa-car', 'fa:user' ] ),
			two.load( [ 'fa:fa-car' ] ),
		] );
		await one.load( [ 'fa:fa-car' ] );

		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
		expect( global.fetch ).toHaveBeenCalledWith( url );
	} );

	it( 'leaves the icons of a pack that failed to load out, and says so once', async () => {
		global.fetch = jest.fn( () => respond( null, false ) );
		const url = `/fa-${ n }.json`;
		const icons = createIcons( { fa: url } );

		await expect( icons.load( [ 'fa:fa-car' ] ) ).resolves.toBeUndefined();
		await icons.load( [ 'fa:fa-car' ] );

		expect( icons.get( 'fa:fa-car' ) ).toBeNull();
		expect( icons.hasUnloaded( [ 'fa:fa-car' ] ) ).toBe( false );
		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
		// eslint-disable-next-line no-console
		expect( console.error ).toHaveBeenCalledTimes( 1 );
		expect( console ).toHaveErrored();
	} );

	it( 'treats a fetch that rejects, or a file that is no JSON, as a failure', async () => {
		global.fetch = jest.fn( () =>
			Promise.reject( new Error( 'offline' ) )
		);
		const icons = createIcons( { fa: `/fa-${ n }.json` } );

		await expect( icons.load( [ 'fa:fa-car' ] ) ).resolves.toBeUndefined();

		expect( icons.get( 'fa:fa-car' ) ).toBeNull();
		expect( console ).toHaveErrored();
	} );
} );
