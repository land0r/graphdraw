/**
 * The block's sidebar: the theme, the controls visitors get, and the text for
 * assistive technology.
 */
import { __, sprintf } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import {
	ExternalLink,
	PanelBody,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';

import {
	SETTINGS_URL,
	SITE_THEME,
	THEME_LABELS,
	getOwnTheme,
	getShownTheme,
} from '../editor/settings';

const THEME_OPTIONS = [
	{
		value: '',
		label: sprintf(
			/* translators: %s: name of the theme set for the whole site, such as "Automatic" or "Forest". */
			__( 'Site default (%s)', 'graphdraw-flowcharts-for-mermaid' ),
			THEME_LABELS[ getShownTheme( SITE_THEME ) ] || SITE_THEME
		),
	},
	...Object.entries( THEME_LABELS ).map( ( [ value, label ] ) => ( {
		value,
		label,
	} ) ),
];

// The controls visitors may get, by the attribute that turns each one on.
const VISITOR_CONTROLS = [
	{
		attribute: 'zoom',
		label: __( 'Zoom controls', 'graphdraw-flowcharts-for-mermaid' ),
	},
	{
		attribute: 'download',
		label: __( 'Download buttons', 'graphdraw-flowcharts-for-mermaid' ),
	},
	{
		attribute: 'copy',
		label: __( 'Copy code button', 'graphdraw-flowcharts-for-mermaid' ),
	},
	{
		attribute: 'fullscreen',
		label: __( 'Fullscreen button', 'graphdraw-flowcharts-for-mermaid' ),
	},
];

/**
 * The block's sidebar.
 *
 * @param {Object}   props               The component props.
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes Updates the block's attributes.
 *
 * @return {JSX.Element} The sidebar's controls.
 */
export default function DiagramSettings( { attributes, setAttributes } ) {
	const { theme, accTitle, accDescr } = attributes;

	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Settings', 'graphdraw-flowcharts-for-mermaid' ) }
			>
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Theme', 'graphdraw-flowcharts-for-mermaid' ) }
					help={
						<>
							{ __(
								'Automatic turns dark on dark backgrounds. A theme set in the code overrides this.',
								'graphdraw-flowcharts-for-mermaid'
							) }
							{ SETTINGS_URL && (
								<>
									{ ' ' }
									<ExternalLink href={ SETTINGS_URL }>
										{ __(
											'Change the site default',
											'graphdraw-flowcharts-for-mermaid'
										) }
									</ExternalLink>
								</>
							) }
						</>
					}
					value={ getShownTheme( getOwnTheme( theme ) ) }
					options={ THEME_OPTIONS }
					onChange={ ( value ) =>
						setAttributes( { theme: value || undefined } )
					}
				/>
			</PanelBody>
			<PanelBody
				title={ __(
					'Visitor controls',
					'graphdraw-flowcharts-for-mermaid'
				) }
			>
				<p className="graphdraw-panel-help">
					{ __(
						'Buttons on the published diagram.',
						'graphdraw-flowcharts-for-mermaid'
					) }
				</p>
				{ VISITOR_CONTROLS.map( ( { attribute, label } ) => (
					<ToggleControl
						key={ attribute }
						__nextHasNoMarginBottom
						label={ label }
						checked={ !! attributes[ attribute ] }
						onChange={ ( value ) =>
							setAttributes( { [ attribute ]: value } )
						}
					/>
				) ) }
			</PanelBody>
			<PanelBody
				title={ __(
					'Accessibility',
					'graphdraw-flowcharts-for-mermaid'
				) }
			>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Title', 'graphdraw-flowcharts-for-mermaid' ) }
					help={ __(
						'A short name, read by screen readers.',
						'graphdraw-flowcharts-for-mermaid'
					) }
					value={ accTitle || '' }
					onChange={ ( value ) =>
						setAttributes( { accTitle: value || undefined } )
					}
				/>
				<TextareaControl
					__nextHasNoMarginBottom
					label={ __(
						'Description',
						'graphdraw-flowcharts-for-mermaid'
					) }
					help={ __(
						'What the diagram shows, read by screen readers.',
						'graphdraw-flowcharts-for-mermaid'
					) }
					value={ accDescr || '' }
					onChange={ ( value ) =>
						setAttributes( { accDescr: value || undefined } )
					}
				/>
			</PanelBody>
		</InspectorControls>
	);
}
