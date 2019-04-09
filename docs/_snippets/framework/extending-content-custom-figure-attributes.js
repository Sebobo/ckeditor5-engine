/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals ClassicEditor, console, window, document */

import { CS_CONFIG } from '@ckeditor/ckeditor5-cloud-services/tests/_utils/cloud-services-config';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

/**
 * Plugin that converts custom attributes for elements that are wrapped in <figure> in the view.
 */
class CustomFigureAttributes extends Plugin {
	init() {
		const editor = this.editor;

		// Define on wchich elements the css classes should be preserved:
		setupCustomClassConversion( 'img', 'image', editor );
		setupCustomClassConversion( 'table', 'table', editor );

		editor.conversion.for( 'upcast' ).add( upcastCustomClasses( 'figure' ), { priority: 'low' } );

		// Define custom attributes that should be preserved.
		setupCustomAttributeConversion( 'img', 'image', 'id', editor );
		setupCustomAttributeConversion( 'table', 'table', 'id', editor );
	}
}

/**
 * Setups conversion that preservers classes on img/table elements
 */
function setupCustomClassConversion( viewElementName, modelElementName, editor ) {
	// The 'customClass' attribute will store custom classes from data in the model so schema definitions to allow this attribute.
	editor.model.schema.extend( modelElementName, { allowAttributes: [ 'customClass' ] } );

	// Define upcast converters for <img> and <table> elements with "low" priority so they are run after default converters.
	editor.conversion.for( 'upcast' ).add( upcastCustomClasses( viewElementName ), { priority: 'low' } );

	// Define downcast converters for model element with "low" priority so they are run after default converters.
	editor.conversion.for( 'downcast' ).add( downcastCustomClasses( modelElementName ), { priority: 'low' } );
}

/**
 * Setups conversion for custom attribute on view elements contained inside figure.
 *
 * This method:
 *
 * - adds proper schema rules
 * - adds an upcast converter
 * - adds a downcast converter
 */
function setupCustomAttributeConversion( viewElementName, modelElementName, viewAttribute, editor ) {
	// Extend schema to store attribute in the model.
	const modelAttribute = `custom${ viewAttribute }`;

	editor.model.schema.extend( modelElementName, { allowAttributes: [ modelAttribute ] } );

	editor.conversion.for( 'upcast' ).add( upcastAttribute( viewElementName, viewAttribute, modelAttribute ) );
	editor.conversion.for( 'downcast' ).add( downcastAttribute( modelElementName, viewElementName, viewAttribute, modelAttribute ) );
}

/**
 * Creates upcast converter that will pass all classes from view element to model element.
 */
function upcastCustomClasses( elementName ) {
	return dispatcher => dispatcher.on( `element:${ elementName }`, ( evt, data, conversionApi ) => {
		const viewItem = data.viewItem;
		const modelRange = data.modelRange;

		const modelElement = modelRange && modelRange.start.nodeAfter;

		if ( !modelElement ) {
			return;
		}

		// The upcast conversion pick up classes from base element and from figure element also so it should be extensible.
		const currentAttributeValue = modelElement.getAttribute( 'customClass' ) || [];

		currentAttributeValue.push( ...viewItem.getClassNames() );

		conversionApi.writer.setAttribute( 'customClass', currentAttributeValue, modelElement );
	} );
}

/**
 * Creates downcast converter that add classes defined in `customClass` attribute to given view element.
 *
 * This converter expects that view element is nested in figure element.
 */
function downcastCustomClasses( modelElementName ) {
	return dispatcher => dispatcher.on( `insert:${ modelElementName }`, ( evt, data, conversionApi ) => {
		const modelElement = data.item;

		const viewFigure = conversionApi.mapper.toViewElement( modelElement );

		if ( !viewFigure ) {
			return;
		}

		// The below code assumes that classes are set on <figure> element...
		conversionApi.writer.addClass( modelElement.getAttribute( 'customClass' ), viewFigure );

		// ... but if you preferIf the classes should be passed to the <img> find the view element inside figure:
		//
		// const viewElement = findViewChild( viewFigure, viewElementName, conversionApi );
		//
		// conversionApi.writer.addClass( modelElement.getAttribute( 'customClass' ), viewElement );
	} );
}

/**
 * Helper method that search for given view element in all children of model element.
 *
 * @param {module:engine/view/item~Item} viewElement
 * @param {String} viewElementName
 * @param {module:engine/conversion/downcastdispatcher~DowncastConversionApi} conversionApi
 * @return {module:engine/view/item~Item}
 */
function findViewChild( viewElement, viewElementName, conversionApi ) {
	const viewChildren = Array.from( conversionApi.writer.createRangeIn( viewElement ).getItems() );

	return viewChildren.find( item => item.is( viewElementName ) );
}

/**
 * Returns custom attribute upcast converter.
 */
function upcastAttribute( viewElementName, viewAttribute, modelAttribute ) {
	return dispatcher => dispatcher.on( `element:${ viewElementName }`, ( evt, data, conversionApi ) => {
		const viewItem = data.viewItem;
		const modelRange = data.modelRange;

		const modelElement = modelRange && modelRange.start.nodeAfter;

		if ( !modelElement ) {
			return;
		}

		conversionApi.writer.setAttribute( modelAttribute, viewItem.getAttribute( viewAttribute ), modelElement );
	} );
}

/**
 * Returns custom attribute downcast converter.
 */
function downcastAttribute( modelElementName, viewElementName, viewAttribute, modelAttribute ) {
	return dispatcher => dispatcher.on( `insert:${ modelElementName }`, ( evt, data, conversionApi ) => {
		const modelElement = data.item;

		const viewFigure = conversionApi.mapper.toViewElement( modelElement );
		const viewElement = findViewChild( viewFigure, viewElementName, conversionApi );

		if ( !viewElement ) {
			return;
		}

		conversionApi.writer.setAttribute( viewAttribute, modelElement.getAttribute( modelAttribute ), viewElement );
	} );
}

ClassicEditor
	.create( document.querySelector( '#snippet-custom-figure-attributes' ), {
		cloudServices: CS_CONFIG,
		extraPlugins: [ CustomFigureAttributes ],
		toolbar: {
			viewportTopOffset: window.getViewportTopOffsetConfig()
		}
	} )
	.then( editor => {
		window.editor = editor;
	} )
	.catch( err => {
		console.error( err.stack );
	} );
