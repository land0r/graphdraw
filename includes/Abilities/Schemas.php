<?php
/**
 * The schemas the abilities share.
 *
 * @package GraphDraw
 */

namespace GraphDraw\Abilities;

use GraphDraw\Options;
use GraphDraw\Posts\PostDiagrams;
use GraphDraw\Renderers;
use GraphDraw\Themes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The parts of a schema that more than one ability has: what addresses a
 * diagram in the input, its code and attributes, and a diagram in the output.
 *
 * With Pele, the code and the theme say what Pele draws of them, so a client
 * doesn't pick a look the site won't show.
 */
final class Schemas {

	/**
	 * The themes a diagram can be drawn in.
	 *
	 * @var Themes
	 */
	private Themes $themes;

	/**
	 * The stored settings, which hold the site's renderer.
	 *
	 * @var Options
	 */
	private Options $options;

	/**
	 * Sets up the schemas.
	 *
	 * @param Themes  $themes  The themes a diagram can be drawn in.
	 * @param Options $options The stored settings, which hold the site's
	 *                         renderer.
	 */
	public function __construct( Themes $themes, Options $options ) {
		$this->themes  = $themes;
		$this->options = $options;
	}

	/**
	 * Tells whether the request's renderer is Pele.
	 *
	 * @return bool True for Pele.
	 */
	private function is_pele(): bool {
		return Renderers::PELE === $this->options->get_renderer();
	}

	/**
	 * Returns the schema of a post ID in the input.
	 *
	 * @return array The schema.
	 */
	public function get_post_id(): array {
		return array(
			'type'        => 'integer',
			'minimum'     => 1,
			'description' => __( 'The ID of the post.', 'graphdraw-flowcharts-for-mermaid' ),
		);
	}

	/**
	 * Returns the schema of a diagram's index in the input.
	 *
	 * @return array The schema.
	 */
	public function get_index(): array {
		return array(
			'type'        => 'integer',
			'minimum'     => 0,
			'description' => __( 'The index of the diagram: its position among the diagrams of the post, in document order, nested blocks included, counting from 0.', 'graphdraw-flowcharts-for-mermaid' ),
		);
	}

	/**
	 * Returns the schema of a diagram's hash in the input.
	 *
	 * @return array The schema.
	 */
	public function get_hash(): array {
		return array(
			'type'        => 'string',
			'pattern'     => '^[0-9a-f]{32}$',
			'description' => __( 'The hash of the diagram, as the last read of it returned. The change fails when the diagram changed since then.', 'graphdraw-flowcharts-for-mermaid' ),
		);
	}

	/**
	 * Returns the schema of Mermaid source in the input.
	 *
	 * @return array The schema.
	 */
	public function get_code(): array {
		$description = __( 'The Mermaid source of the diagram. It is not validated: use the graphdraw/validate-diagram ability in the block editor for that.', 'graphdraw-flowcharts-for-mermaid' );

		if ( $this->is_pele() ) {
			$description .= ' ' . __( 'The site draws diagrams with Pele, which ignores colours set in the code, such as themeVariables, and draws a theme set in it as light or dark.', 'graphdraw-flowcharts-for-mermaid' );
		}

		return array(
			'type'        => 'string',
			'minLength'   => 1,
			'description' => $description,
		);
	}

	/**
	 * Returns the schema of the attributes of a diagram, other than its code,
	 * in the input: each attribute of PostDiagrams::ATTRIBUTES, with its type
	 * from there.
	 *
	 * @return array The schema.
	 */
	public function get_attributes(): array {
		$details    = $this->get_attribute_details();
		$properties = array();

		foreach ( PostDiagrams::ATTRIBUTES as $name => $type ) {
			$properties[ $name ] = array( 'type' => $type ) + ( isset( $details[ $name ] ) ? $details[ $name ] : array() );
		}

		return array(
			'type'                 => 'object',
			'description'          => __( 'Attributes of the diagram block besides its code. An empty string or false removes an attribute.', 'graphdraw-flowcharts-for-mermaid' ),
			'properties'           => $properties,
			'additionalProperties' => false,
		);
	}

	/**
	 * Returns the schema of a diagram in the output, as
	 * PostDiagrams::describe() returns it.
	 *
	 * @return array The schema.
	 */
	public function get_diagram(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'post_id'    => array(
					'type'        => 'integer',
					'description' => __( 'The ID of the post the diagram is in.', 'graphdraw-flowcharts-for-mermaid' ),
				),
				'index'      => array(
					'type'        => 'integer',
					'description' => __( 'The index of the diagram in the post, counting from 0.', 'graphdraw-flowcharts-for-mermaid' ),
				),
				'hash'       => array(
					'type'        => 'string',
					'description' => __( 'The hash of the diagram. Pass it to change or delete the diagram.', 'graphdraw-flowcharts-for-mermaid' ),
				),
				'code'       => array(
					'type'        => 'string',
					'description' => __( 'The Mermaid source.', 'graphdraw-flowcharts-for-mermaid' ),
				),
				'type'       => array(
					'type'        => 'string',
					'description' => __( 'The keyword the source starts with, such as flowchart or sequenceDiagram. Empty when there is none.', 'graphdraw-flowcharts-for-mermaid' ),
				),
				'validated'  => array(
					'type'        => 'boolean',
					'description' => __( 'Always false: the server cannot parse Mermaid.', 'graphdraw-flowcharts-for-mermaid' ),
				),
				'attributes' => array(
					'type'        => 'object',
					'description' => __( 'The other attributes of the diagram block.', 'graphdraw-flowcharts-for-mermaid' ),
				),
			),
		);
	}

	/**
	 * Returns what the schema says about each attribute besides its type: what
	 * it is, and the values it takes.
	 *
	 * @return array[] The description of each attribute of
	 *                 PostDiagrams::ATTRIBUTES, and its `enum` where it has
	 *                 one, by name.
	 */
	private function get_attribute_details(): array {
		$theme = __( 'The theme of the diagram. Without one, the theme set for the site.', 'graphdraw-flowcharts-for-mermaid' );

		// Every theme is still taken: a diagram that has another one, from before the site switched to Pele, keeps it.
		if ( $this->is_pele() ) {
			$theme .= ' ' . __( 'The site draws diagrams with Pele, which draws every theme as light or dark: use auto, which follows the page, default for light, or dark.', 'graphdraw-flowcharts-for-mermaid' );
		}

		return array(
			'theme'      => array(
				'enum'        => array_merge( array( '' ), array_keys( $this->themes->get_all() ) ),
				'description' => $theme,
			),
			'caption'    => array(
				'description' => __( 'A caption shown under the diagram. It may hold the HTML allowed in posts.', 'graphdraw-flowcharts-for-mermaid' ),
			),
			'zoom'       => array(
				'description' => __( 'Whether visitors get zoom controls.', 'graphdraw-flowcharts-for-mermaid' ),
			),
			'download'   => array(
				'description' => __( 'Whether visitors get buttons that download the diagram as an SVG or PNG file.', 'graphdraw-flowcharts-for-mermaid' ),
			),
			'copy'       => array(
				'description' => __( 'Whether visitors get a button that copies the code of the diagram.', 'graphdraw-flowcharts-for-mermaid' ),
			),
			'fullscreen' => array(
				'description' => __( 'Whether visitors get a button that shows the diagram over the whole screen.', 'graphdraw-flowcharts-for-mermaid' ),
			),
			'accTitle'   => array(
				'description' => __( 'A title of the diagram for screen readers.', 'graphdraw-flowcharts-for-mermaid' ),
			),
			'accDescr'   => array(
				'description' => __( 'A description of the diagram for screen readers.', 'graphdraw-flowcharts-for-mermaid' ),
			),
			'align'      => array(
				'enum'        => array( '', 'center', 'wide', 'full' ),
				'description' => __( 'The alignment of the diagram.', 'graphdraw-flowcharts-for-mermaid' ),
			),
		);
	}
}
