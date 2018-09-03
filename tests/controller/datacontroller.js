/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Model from '../../src/model/model';
import ModelRange from '../../src/model/range';
import ViewRange from '../../src/view/range';
import DataController from '../../src/controller/datacontroller';
import HtmlDataProcessor from '../../src/dataprocessor/htmldataprocessor';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';

import ModelDocumentFragment from '../../src/model/documentfragment';
import ViewDocumentFragment from '../../src/view/documentfragment';

import { getData, setData, stringify, parse as parseModel } from '../../src/dev-utils/model';
import { parse as parseView, stringify as stringifyView } from '../../src/dev-utils/view';

import count from '@ckeditor/ckeditor5-utils/src/count';

import {
	upcastElementToElement,
	upcastElementToAttribute
} from '../../src/conversion/upcast-converters';

import {
	downcastElementToElement,
	downcastAttributeToElement,
	downcastMarkerToHighlight
} from '../../src/conversion/downcast-converters';

describe( 'DataController', () => {
	let model, modelDocument, htmlDataProcessor, data, schema;

	beforeEach( () => {
		model = new Model();

		schema = model.schema;
		modelDocument = model.document;

		modelDocument.createRoot();
		modelDocument.createRoot( '$title', 'title' );

		schema.register( '$title', { inheritAllFrom: '$root' } );

		htmlDataProcessor = new HtmlDataProcessor();

		data = new DataController( model, htmlDataProcessor );
	} );

	describe( 'constructor()', () => {
		it( 'works without data processor', () => {
			const data = new DataController( model );

			expect( data.processor ).to.be.undefined;
		} );
	} );

	describe( 'parse()', () => {
		it( 'should set text', () => {
			schema.extend( '$text', { allowIn: '$root' } );
			const output = data.parse( '<p>foo<b>bar</b></p>' );

			expect( output ).to.instanceof( ModelDocumentFragment );
			expect( stringify( output ) ).to.equal( 'foobar' );
		} );

		it( 'should set paragraph', () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );

			upcastElementToElement( { view: 'p', model: 'paragraph' } )( data.upcastDispatcher );

			const output = data.parse( '<p>foo<b>bar</b></p>' );

			expect( output ).to.instanceof( ModelDocumentFragment );
			expect( stringify( output ) ).to.equal( '<paragraph>foobar</paragraph>' );
		} );

		it( 'should set two paragraphs', () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );

			upcastElementToElement( { view: 'p', model: 'paragraph' } )( data.upcastDispatcher );

			const output = data.parse( '<p>foo</p><p>bar</p>' );

			expect( output ).to.instanceof( ModelDocumentFragment );
			expect( stringify( output ) ).to.equal( '<paragraph>foo</paragraph><paragraph>bar</paragraph>' );
		} );

		it( 'should set paragraphs with bold', () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );
			schema.extend( '$text', {
				allowAttributes: [ 'bold' ]
			} );

			upcastElementToElement( { view: 'p', model: 'paragraph' } )( data.upcastDispatcher );
			upcastElementToAttribute( { view: 'strong', model: 'bold' } )( data.upcastDispatcher );

			const output = data.parse( '<p>foo<strong>bar</strong></p>' );

			expect( output ).to.instanceof( ModelDocumentFragment );
			expect( stringify( output ) ).to.equal( '<paragraph>foo<$text bold="true">bar</$text></paragraph>' );
		} );

		it( 'should parse in the root context by default', () => {
			const output = data.parse( 'foo' );

			expect( stringify( output ) ).to.equal( '' );
		} );

		it( 'should accept parsing context', () => {
			const output = data.parse( 'foo', [ '$block' ] );

			expect( stringify( output ) ).to.equal( 'foo' );
		} );
	} );

	describe( 'toModel()', () => {
		beforeEach( () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );

			upcastElementToElement( { view: 'p', model: 'paragraph' } )( data.upcastDispatcher );
		} );

		it( 'should convert content of an element #1', () => {
			const viewElement = parseView( '<p>foo</p>' );
			const output = data.toModel( viewElement );

			expect( output ).to.instanceof( ModelDocumentFragment );
			expect( stringify( output ) ).to.equal( '<paragraph>foo</paragraph>' );
		} );

		it( 'should convert content of an element #2', () => {
			const viewFragment = parseView( '<p>foo</p><p>bar</p>' );
			const output = data.toModel( viewFragment );

			expect( output ).to.be.instanceOf( ModelDocumentFragment );
			expect( stringify( output ) ).to.equal( '<paragraph>foo</paragraph><paragraph>bar</paragraph>' );
		} );

		it( 'should accept parsing context', () => {
			modelDocument.createRoot( 'inlineRoot', 'inlineRoot' );

			schema.register( 'inlineRoot' );
			schema.extend( '$text', { allowIn: 'inlineRoot' } );

			const viewFragment = new ViewDocumentFragment( [ parseView( 'foo' ) ] );

			// Model fragment in root.
			expect( stringify( data.toModel( viewFragment ) ) ).to.equal( '' );

			// Model fragment in inline root.
			expect( stringify( data.toModel( viewFragment, [ 'inlineRoot' ] ) ) ).to.equal( 'foo' );
		} );
	} );

	describe( 'init()', () => {
		it( 'should be decorated', () => {
			const spy = sinon.spy();

			data.on( 'init', spy );

			data.init( 'foo bar' );

			sinon.assert.calledWithExactly( spy, sinon.match.any, [ 'foo bar' ] );
		} );

		it( 'should throw an error when document data is already initialized', () => {
			data.init( '<p>Foo</p>' );

			expect( () => {
				data.init( '<p>Bar</p>' );
			} ).to.throw(
				CKEditorError,
				'datacontroller-init-document-not-empty: Trying to set initial data to not empty document.'
			);
		} );

		it( 'should set data to default main root', () => {
			schema.extend( '$text', { allowIn: '$root' } );
			data.init( 'foo' );

			expect( getData( model, { withoutSelection: true } ) ).to.equal( 'foo' );
		} );

		it( 'should get root name as a parameter', () => {
			schema.extend( '$text', { allowIn: '$root' } );
			data.init( 'foo', 'title' );

			expect( getData( model, { withoutSelection: true, rootName: 'title' } ) ).to.equal( 'foo' );
		} );

		it( 'should create a batch', () => {
			schema.extend( '$text', { allowIn: '$root' } );
			data.init( 'foo' );

			expect( count( modelDocument.history.getOperations() ) ).to.equal( 1 );
		} );

		it( 'should cause firing change event', () => {
			const spy = sinon.spy();

			schema.extend( '$text', { allowIn: '$root' } );
			model.document.on( 'change', spy );

			data.init( 'foo' );

			expect( spy.calledOnce ).to.be.true;
		} );

		it( 'should return a resolved Promise', () => {
			const promise = data.init( '<p>Foo</p>' );

			expect( promise ).to.be.instanceof( Promise );

			return promise;
		} );
	} );

	describe( 'set()', () => {
		it( 'should set data to default main root', () => {
			schema.extend( '$text', { allowIn: '$root' } );
			data.set( 'foo' );

			expect( getData( model, { withoutSelection: true } ) ).to.equal( 'foo' );
		} );

		it( 'should create a batch', () => {
			schema.extend( '$text', { allowIn: '$root' } );
			data.set( 'foo' );

			expect( count( modelDocument.history.getOperations() ) ).to.equal( 1 );
		} );

		it( 'should cause firing change event', () => {
			const spy = sinon.spy();

			schema.extend( '$text', { allowIn: '$root' } );
			model.document.on( 'change', spy );

			data.set( 'foo' );

			expect( spy.calledOnce ).to.be.true;
		} );

		it( 'should get root name as a parameter', () => {
			schema.extend( '$text', { allowIn: '$root' } );
			data.set( 'foo', 'main' );
			data.set( 'Bar', 'title' );

			expect( getData( model, { withoutSelection: true, rootName: 'main' } ) ).to.equal( 'foo' );
			expect( getData( model, { withoutSelection: true, rootName: 'title' } ) ).to.equal( 'Bar' );

			expect( count( modelDocument.history.getOperations() ) ).to.equal( 2 );
		} );

		it( 'should parse given data before set in a context of correct root', () => {
			schema.extend( '$text', { allowIn: '$title', disallowIn: '$root' } );
			data.set( 'foo', 'main' );
			data.set( 'Bar', 'title' );

			expect( getData( model, { withoutSelection: true, rootName: 'main' } ) ).to.equal( '' );
			expect( getData( model, { withoutSelection: true, rootName: 'title' } ) ).to.equal( 'Bar' );

			expect( count( modelDocument.history.getOperations() ) ).to.equal( 2 );
		} );

		// This case was added when order of params was different and it really didn't work. Let's keep it
		// if anyone will ever try to change this.
		it( 'should allow setting empty data', () => {
			schema.extend( '$text', { allowIn: '$root' } );

			data.set( 'foo', 'title' );

			expect( getData( model, { withoutSelection: true, rootName: 'title' } ) ).to.equal( 'foo' );

			data.set( '', 'title' );

			expect( getData( model, { withoutSelection: true, rootName: 'title' } ) ).to.equal( '' );
		} );
	} );

	describe( 'get()', () => {
		it( 'should get paragraph with text', () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );
			setData( model, '<paragraph>foo</paragraph>' );

			downcastElementToElement( { model: 'paragraph', view: 'p' } )( data.downcastDispatcher );

			expect( data.get() ).to.equal( '<p>foo</p>' );
		} );

		it( 'should get empty paragraph', () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );
			setData( model, '<paragraph></paragraph>' );

			downcastElementToElement( { model: 'paragraph', view: 'p' } )( data.downcastDispatcher );

			expect( data.get() ).to.equal( '<p>&nbsp;</p>' );
		} );

		it( 'should get two paragraphs', () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );
			setData( model, '<paragraph>foo</paragraph><paragraph>bar</paragraph>' );

			downcastElementToElement( { model: 'paragraph', view: 'p' } )( data.downcastDispatcher );

			expect( data.get() ).to.equal( '<p>foo</p><p>bar</p>' );
		} );

		it( 'should get text directly in root', () => {
			schema.extend( '$text', { allowIn: '$root' } );
			setData( model, 'foo' );

			expect( data.get() ).to.equal( 'foo' );
		} );

		it( 'should get paragraphs without bold', () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );
			setData( model, '<paragraph>foo<$text bold="true">bar</$text></paragraph>' );

			downcastElementToElement( { model: 'paragraph', view: 'p' } )( data.downcastDispatcher );

			expect( data.get() ).to.equal( '<p>foobar</p>' );
		} );

		it( 'should get paragraphs with bold', () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );
			setData( model, '<paragraph>foo<$text bold="true">bar</$text></paragraph>' );

			downcastElementToElement( { model: 'paragraph', view: 'p' } )( data.downcastDispatcher );
			downcastAttributeToElement( { model: 'bold', view: 'strong' } )( data.downcastDispatcher );

			expect( data.get() ).to.equal( '<p>foo<strong>bar</strong></p>' );
		} );

		it( 'should get root name as a parameter', () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );
			schema.extend( '$text', { allowIn: '$root' } );

			setData( model, '<paragraph>foo</paragraph>', { rootName: 'main' } );
			setData( model, 'Bar', { rootName: 'title' } );

			downcastElementToElement( { model: 'paragraph', view: 'p' } )( data.downcastDispatcher );
			downcastAttributeToElement( { model: 'bold', view: 'strong' } )( data.downcastDispatcher );

			expect( data.get() ).to.equal( '<p>foo</p>' );
			expect( data.get( 'main' ) ).to.equal( '<p>foo</p>' );
			expect( data.get( 'title' ) ).to.equal( 'Bar' );
		} );
	} );

	describe( 'stringify()', () => {
		beforeEach( () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );
			schema.register( 'div' );

			schema.extend( '$block', { allowIn: 'div' } );
			schema.extend( 'div', { allowIn: '$root' } );

			downcastElementToElement( { model: 'paragraph', view: 'p' } )( data.downcastDispatcher );
		} );

		it( 'should stringify a content of an element', () => {
			const modelElement = parseModel( '<div><paragraph>foo</paragraph></div>', schema );

			expect( data.stringify( modelElement ) ).to.equal( '<p>foo</p>' );
		} );

		it( 'should stringify a content of a document fragment', () => {
			const modelDocumentFragment = parseModel( '<paragraph>foo</paragraph><paragraph>bar</paragraph>', schema );

			expect( data.stringify( modelDocumentFragment ) ).to.equal( '<p>foo</p><p>bar</p>' );
		} );
	} );

	describe( 'toView()', () => {
		beforeEach( () => {
			schema.register( 'paragraph', { inheritAllFrom: '$block' } );
			schema.register( 'div' );

			schema.extend( '$block', { allowIn: 'div' } );
			schema.extend( 'div', { allowIn: '$root' } );

			downcastElementToElement( { model: 'paragraph', view: 'p' } )( data.downcastDispatcher );
		} );

		it( 'should convert a content of an element', () => {
			const modelElement = parseModel( '<div><paragraph>foo</paragraph></div>', schema );

			const viewDocumentFragment = data.toView( modelElement );

			expect( viewDocumentFragment ).to.be.instanceOf( ViewDocumentFragment );

			const viewElement = viewDocumentFragment.getChild( 0 );

			expect( viewElement.name ).to.equal( 'p' );
			expect( viewElement.childCount ).to.equal( 1 );
			expect( viewElement.getChild( 0 ).data ).to.equal( 'foo' );
		} );

		it( 'should correctly convert document markers #1', () => {
			const modelElement = parseModel( '<div><paragraph>foobar</paragraph></div>', schema );
			const modelRoot = model.document.getRoot();

			downcastMarkerToHighlight( { model: 'marker:a', view: { classes: 'a' } } )( data.downcastDispatcher );

			model.change( writer => {
				writer.insert( modelElement, modelRoot, 0 );
				const range = ModelRange.createFromParentsAndOffsets( modelRoot, 0, modelRoot, 1 );
				writer.addMarker( 'marker:a', { range, usingOperation: true } );
			} );

			const viewDocumentFragment = data.toView( modelElement );
			const viewElement = viewDocumentFragment.getChild( 0 );

			expect( stringifyView( viewElement ) ).to.equal( '<p><span class="a">foobar</span></p>' );
		} );

		it( 'should correctly convert document markers #2', () => {
			const modelElement = parseModel( '<div><paragraph>foo</paragraph><paragraph>bar</paragraph></div>', schema );
			const modelRoot = model.document.getRoot();

			downcastMarkerToHighlight( { model: 'marker:a', view: { classes: 'a' } } )( data.downcastDispatcher );
			downcastMarkerToHighlight( { model: 'marker:b', view: { classes: 'b' } } )( data.downcastDispatcher );

			const modelP1 = modelElement.getChild( 0 );
			const modelP2 = modelElement.getChild( 1 );

			model.change( writer => {
				writer.insert( modelElement, modelRoot, 0 );

				const rangeA = ModelRange.createFromParentsAndOffsets( modelP1, 1, modelP1, 3 );
				const rangeB = ModelRange.createFromParentsAndOffsets( modelP2, 0, modelP2, 2 );

				writer.addMarker( 'marker:a', { range: rangeA, usingOperation: true } );
				writer.addMarker( 'marker:b', { range: rangeB, usingOperation: true } );
			} );

			const viewDocumentFragment = data.toView( modelP1 );

			expect( stringifyView( viewDocumentFragment ) ).to.equal( 'f<span class="a">oo</span>' );
		} );

		it( 'should convert a document fragment', () => {
			const modelDocumentFragment = parseModel( '<paragraph>foo</paragraph><paragraph>bar</paragraph>', schema );
			const viewDocumentFragment = data.toView( modelDocumentFragment );

			expect( viewDocumentFragment ).to.be.instanceOf( ViewDocumentFragment );
			expect( viewDocumentFragment ).to.have.property( 'childCount', 2 );

			const viewElement = viewDocumentFragment.getChild( 0 );

			expect( viewElement.name ).to.equal( 'p' );
			expect( viewElement.childCount ).to.equal( 1 );
			expect( viewElement.getChild( 0 ).data ).to.equal( 'foo' );
		} );

		it( 'should keep view-model mapping', () => {
			const modelDocumentFragment = parseModel( '<paragraph>foo</paragraph><paragraph>bar</paragraph>', schema );
			const viewDocumentFragment = data.toView( modelDocumentFragment );

			const firstModelElement = modelDocumentFragment.getChild( 0 );
			const firstViewElement = viewDocumentFragment.getChild( 0 );

			const modelRange = ModelRange.createOn( firstModelElement );
			const viewRange = ViewRange.createOn( firstViewElement );

			const mappedModelRange = data.mapper.toModelRange( viewRange );
			const mappedViewRange = data.mapper.toViewRange( modelRange );

			expect( mappedModelRange ).to.be.instanceOf( ModelRange );
			expect( mappedViewRange ).to.be.instanceOf( ViewRange );

			expect( mappedModelRange.end.nodeBefore ).to.equal( firstModelElement );
			expect( mappedModelRange.end.nodeAfter ).to.equal( modelDocumentFragment.getChild( 1 ) );
			expect( mappedViewRange.end.nodeBefore ).to.equal( firstViewElement );
			expect( mappedViewRange.end.nodeAfter ).to.equal( viewDocumentFragment.getChild( 1 ) );
		} );
	} );

	describe( 'destroy()', () => {
		it( 'should be there for you', () => {
			// Should not throw.
			data.destroy();

			expect( data ).to.respondTo( 'destroy' );
		} );
	} );
} );
