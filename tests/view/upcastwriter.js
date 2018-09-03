/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Element from '../../src/view/element';
import UpcastWriter from '../../src/view/upcastwriter';
import HtmlDataProcessor from '../../src/dataprocessor/htmldataprocessor';

describe( 'UpcastWriter', () => {
	let writer, view, dataprocessor;

	before( () => {
		writer = new UpcastWriter();
		dataprocessor = new HtmlDataProcessor();
	} );

	beforeEach( () => {
		const html = '' +
			'<h1 style="color:blue;position:fixed;">Heading <strong>1</strong></h1>' +
			'<p class="foo1 bar2" style="text-align:left;" data-attr="abc">Foo <i>Bar</i> <strong>Bold</strong></p>' +
			'<p><u>Some underlined</u> text</p>' +
			'<ul>' +
			'<li class="single">Item 1</li>' +
			'<li><span>Item <s>1</s></span></li>' +
			'<li><h2>Item 1</h2></li>' +
			'</ul>';

		view = dataprocessor.toView( html );
	} );

	describe( 'clone', () => {
		it( 'should clone simple element', () => {
			const el = view.getChild( 0 );
			const clone = writer.clone( el );

			expect( clone ).to.not.equal( el );
			expect( clone.isSimilar( el ) ).to.true;
			expect( clone.childCount ).to.equal( 0 );
		} );

		it( 'should clone element with all attributes', () => {
			const el = view.getChild( 1 );
			const clone = writer.clone( el );

			expect( clone ).to.not.equal( el );
			expect( clone.isSimilar( el ) ).to.true;
			expect( clone.childCount ).to.equal( 0 );
		} );

		it( 'should deep clone element', () => {
			const el = view.getChild( 0 );
			const clone = writer.clone( el, true );

			expect( clone ).to.not.equal( el );
			expect( clone.isSimilar( el ) ).to.true;
			expect( clone.childCount ).to.equal( el.childCount );
		} );
	} );

	describe( 'appendChild', () => {
		it( 'should append inline child to paragraph', () => {
			const el = view.getChild( 2 );
			const newChild = new Element( 'span' );

			const appended = writer.appendChild( newChild, el );

			expect( appended ).to.equal( 1 );
			expect( newChild.parent ).to.equal( el );
			expect( el.childCount ).to.equal( 3 );
		} );

		it( 'should append block children to paragraph', () => {
			const el = view.getChild( 2 );
			const newChild1 = new Element( 'p' );
			const newChild2 = new Element( 'h2' );

			const appended = writer.appendChild( [ newChild1, newChild2 ], el );

			expect( appended ).to.equal( 2 );
			expect( newChild1.parent ).to.equal( el );
			expect( newChild2.parent ).to.equal( el );
			expect( el.childCount ).to.equal( 4 );
		} );

		it( 'should append list item to the list', () => {
			const el = view.getChild( 3 );
			const newChild = new Element( 'li' );

			const appended = writer.appendChild( newChild, el );

			expect( appended ).to.equal( 1 );
			expect( newChild.parent ).to.equal( el );
			expect( el.childCount ).to.equal( 4 );
		} );

		it( 'should append element to DocumentFragment element', () => {
			const newChild = new Element( 'p' );

			const appended = writer.appendChild( newChild, view );

			expect( appended ).to.equal( 1 );
			expect( newChild.parent ).to.equal( view );
			expect( view.childCount ).to.equal( 5 );
		} );
	} );

	describe( 'insertChild', () => {
		it( 'should insert inline child into the paragraph on the first position', () => {
			const el = view.getChild( 2 );
			const newChild = new Element( 'span' );

			const inserted = writer.insertChild( 0, newChild, el );

			expect( inserted ).to.equal( 1 );
			expect( newChild.parent ).to.equal( el );
			expect( el.getChild( 0 ) ).to.equal( newChild );
			expect( el.childCount ).to.equal( 3 );
		} );

		it( 'should insert block children into the paragraph on the last position', () => {
			const el = view.getChild( 2 );
			const newChild1 = new Element( 'blockquote' );
			const newChild2 = new Element( 'h2' );

			const inserted = writer.insertChild( 2, [ newChild1, newChild2 ], el );

			expect( inserted ).to.equal( 2 );
			expect( newChild1.parent ).to.equal( el );
			expect( newChild2.parent ).to.equal( el );
			expect( el.getChild( 2 ) ).to.equal( newChild1 );
			expect( el.getChild( 3 ) ).to.equal( newChild2 );
			expect( el.childCount ).to.equal( 4 );
		} );

		it( 'should insert list item into the list element', () => {
			const el = view.getChild( 3 );
			const newChild = new Element( 'li' );

			const inserted = writer.insertChild( 1, newChild, el );

			expect( inserted ).to.equal( 1 );
			expect( newChild.parent ).to.equal( el );
			expect( el.getChild( 1 ) ).to.equal( newChild );
			expect( el.childCount ).to.equal( 4 );
		} );

		it( 'should insert element to DocumentFragment element', () => {
			const newChild = new Element( 'p' );

			const inserted = writer.insertChild( 4, newChild, view );

			expect( inserted ).to.equal( 1 );
			expect( newChild.parent ).to.equal( view );
			expect( view.getChild( 4 ) ).to.equal( newChild );
			expect( view.childCount ).to.equal( 5 );
		} );
	} );

	describe( 'removeChildren', () => {
		it( 'should remove child from the beginning of the paragraph', () => {
			const el = view.getChild( 1 );
			const toRemove = el.getChild( 0 );

			const removed = writer.removeChildren( 0, 1, el );

			expect( removed.length ).to.equal( 1 );
			expect( removed[ 0 ] ).to.equal( toRemove );
			expect( el.childCount ).to.equal( 3 );
		} );

		it( 'should remove two last list items from the list element', () => {
			const el = view.getChild( 3 );
			const toRemove1 = el.getChild( 1 );
			const toRemove2 = el.getChild( 2 );

			const removed = writer.removeChildren( 1, 2, el );

			expect( removed.length ).to.equal( 2 );
			expect( removed[ 0 ] ).to.equal( toRemove1 );
			expect( removed[ 1 ] ).to.equal( toRemove2 );
			expect( el.childCount ).to.equal( 1 );
		} );

		it( 'should remove child from DocumentFragment element', () => {
			const toRemove = view.getChild( 2 );

			const removed = writer.removeChildren( 2, 1, view );

			expect( removed.length ).to.equal( 1 );
			expect( removed[ 0 ] ).to.equal( toRemove );
			expect( view.childCount ).to.equal( 3 );
		} );
	} );

	describe( 'remove', () => {
		it( 'should remove list item from the list element', () => {
			const toRemove = view.getChild( 3 ).getChild( 1 );

			const removed = writer.remove( toRemove );

			expect( removed.length ).to.equal( 1 );
			expect( removed[ 0 ] ).to.equal( toRemove );
			expect( view.getChild( 3 ).childCount ).to.equal( 2 );
		} );

		it( 'should have no effect on detached elements', () => {
			const newChild = new Element( 'h2' );

			const removed = writer.remove( newChild );

			expect( removed.length ).to.equal( 0 );
			expect( view.childCount ).to.equal( 4 );
		} );

		it( 'should remove direct root (DocumentFragment) child', () => {
			const toRemove = view.getChild( 3 );

			const removed = writer.remove( toRemove );

			expect( removed.length ).to.equal( 1 );
			expect( removed[ 0 ] ).to.equal( toRemove );
			expect( view.childCount ).to.equal( 3 );
		} );
	} );

	describe( 'replace', () => {
		it( 'should replace single element', () => {
			const el = view.getChild( 0 ).getChild( 1 );
			const newChild = new Element( 'span' );

			const replacement = writer.replace( el, newChild );

			expect( replacement ).to.true;
			expect( view.getChild( 0 ).getChild( 1 ) ).to.equal( newChild );
			expect( view.getChild( 0 ).childCount ).to.equal( 2 );
		} );

		it( 'should replace element with children', () => {
			const el = view.getChild( 3 );
			const newChild = new Element( 'ol' );

			const replacement = writer.replace( el, newChild );

			expect( replacement ).to.true;
			expect( view.getChild( 3 ) ).to.equal( newChild );
			expect( view.childCount ).to.equal( 4 );
		} );

		it( 'should have no effect on detached elements', () => {
			const oldChild = new Element( 'h2' );
			const newChild = new Element( 'h2' );

			const replacement = writer.replace( oldChild, newChild );

			expect( replacement ).to.false;
			expect( view.childCount ).to.equal( 4 );
		} );
	} );

	describe( 'rename', () => {
		it( 'should rename simple element', () => {
			const el = view.getChild( 0 ).getChild( 1 );

			const renamed = writer.rename( 'i', el );

			expect( renamed ).to.not.equal( el );
			expect( renamed ).to.equal( view.getChild( 0 ).getChild( 1 ) );
			expect( renamed.name ).to.equal( 'i' );
			expect( view.getChild( 0 ).childCount ).to.equal( 2 );
		} );

		it( 'should rename direct root (DocumentFragment) child element', () => {
			const el = view.getChild( 1 );

			const renamed = writer.rename( 'h3', el );

			expect( renamed ).to.not.equal( el );
			expect( renamed ).to.equal( view.getChild( 1 ) );
			expect( renamed.name ).to.equal( 'h3' );
			expect( view.childCount ).to.equal( 4 );
		} );

		it( 'should have no effect on detached element', () => {
			const el = new Element( 'h2' );

			const renamed = writer.rename( 'h3', el );

			expect( renamed ).to.null;
			expect( view.childCount ).to.equal( 4 );
		} );
	} );

	describe( 'setAttribute', () => {
		it( 'should add new attribute', () => {
			const el = view.getChild( 0 );

			writer.setAttribute( 'testAttr', 'testVal', el );

			expect( el.getAttribute( 'testAttr' ) ).to.equal( 'testVal' );
		} );

		it( 'should update existing attribute', () => {
			const el = view.getChild( 1 );

			writer.setAttribute( 'data-attr', 'foo', el );

			expect( el.getAttribute( 'data-attr' ) ).to.equal( 'foo' );
		} );
	} );

	describe( 'removeAttribute', () => {
		it( 'should remove existing attribute', () => {
			const el = view.getChild( 1 );

			writer.removeAttribute( 'data-attr', el );

			expect( el.hasAttribute( 'data-attr' ) ).to.false;
		} );

		it( 'should have no effect if attribute does not exists', () => {
			const el = view.getChild( 0 );

			writer.removeAttribute( 'non-existent', el );

			expect( el.hasAttribute( 'non-existent' ) ).to.false;
		} );
	} );

	describe( 'addClass', () => {
		it( 'should add new classes if no classes', () => {
			const el = view.getChild( 2 );

			writer.addClass( [ 'foo', 'bar' ], el );

			expect( el.hasClass( 'foo' ) ).to.true;
			expect( el.hasClass( 'bar' ) ).to.true;
			expect( Array.from( el.getClassNames() ).length ).to.equal( 2 );
		} );

		it( 'should add new class to existing classes', () => {
			const el = view.getChild( 1 );

			writer.addClass( 'newClass', el );

			expect( el.hasClass( 'newClass' ) ).to.true;
			expect( Array.from( el.getClassNames() ).length ).to.equal( 3 );
		} );
	} );

	describe( 'removeClass', () => {
		it( 'should remove existing class', () => {
			const el = view.getChild( 3 ).getChild( 0 );

			writer.removeClass( 'single', el );

			expect( el.hasClass( 'single' ) ).to.false;
			expect( Array.from( el.getClassNames() ).length ).to.equal( 0 );
		} );

		it( 'should remove existing class from many classes', () => {
			const el = view.getChild( 1 );

			writer.removeClass( 'foo1', el );

			expect( el.hasClass( 'foo1' ) ).to.false;
			expect( el.hasClass( 'bar2' ) ).to.true;
			expect( Array.from( el.getClassNames() ).length ).to.equal( 1 );
		} );

		it( 'should have no effect if there are no classes', () => {
			const el = view.getChild( 0 );

			writer.removeClass( 'non-existent', el );

			expect( el.hasClass( 'non-existent' ) ).to.false;
			expect( Array.from( el.getClassNames() ).length ).to.equal( 0 );
		} );
	} );

	describe( 'setStyle', () => {
		it( 'should add new style', () => {
			const el = view.getChild( 2 );

			writer.setStyle( {
				color: 'red',
				position: 'fixed'
			}, el );

			expect( el.getStyle( 'color' ) ).to.equal( 'red' );
			expect( el.getStyle( 'position' ) ).to.equal( 'fixed' );
			expect( Array.from( el.getStyleNames() ).length ).to.equal( 2 );
		} );

		it( 'should update existing styles', () => {
			const el = view.getChild( 1 );

			writer.setStyle( 'text-align', 'center', el );

			expect( el.getStyle( 'text-align' ) ).to.equal( 'center' );
			expect( Array.from( el.getStyleNames() ).length ).to.equal( 1 );
		} );
	} );

	describe( 'removeStyle', () => {
		it( 'should remove existing style', () => {
			const el = view.getChild( 0 );

			writer.removeStyle( [ 'color', 'position' ], el );

			expect( el.hasStyle( 'color' ) ).to.false;
			expect( el.hasStyle( 'position' ) ).to.false;
			expect( Array.from( el.getStyleNames() ).length ).to.equal( 0 );
		} );

		it( 'should remove value from existing styles', () => {
			const el = view.getChild( 0 );

			writer.removeStyle( 'position', el );

			expect( el.hasStyle( 'color' ) ).to.true;
			expect( el.hasStyle( 'position' ) ).to.false;
			expect( Array.from( el.getStyleNames() ).length ).to.equal( 1 );
		} );

		it( 'should have no effect if styles does not exists', () => {
			const el = view.getChild( 2 );

			writer.removeStyle( [ 'color', 'position' ], el );

			expect( el.hasStyle( 'color' ) ).to.false;
			expect( el.hasStyle( 'position' ) ).to.false;
			expect( Array.from( el.getStyleNames() ).length ).to.equal( 0 );
		} );
	} );

	describe( 'setCustomProperty', () => {
		it( 'should add or update custom property', () => {
			const el = new Element( 'span' );

			writer.setCustomProperty( 'prop1', 'foo', el );
			writer.setCustomProperty( 'prop2', 'bar', el );

			expect( el.getCustomProperty( 'prop1' ) ).to.equal( 'foo' );
			expect( el.getCustomProperty( 'prop2' ) ).to.equal( 'bar' );
			expect( Array.from( el.getCustomProperties() ).length ).to.equal( 2 );

			const objectProperty = { foo: 'bar' };
			writer.setCustomProperty( 'prop2', objectProperty, el );

			expect( el.getCustomProperty( 'prop1' ) ).to.equal( 'foo' );
			expect( el.getCustomProperty( 'prop2' ) ).to.equal( objectProperty );
			expect( Array.from( el.getCustomProperties() ).length ).to.equal( 2 );
		} );
	} );

	describe( 'removeCustomProperty', () => {
		it( 'should remove existing custom property', () => {
			const el = new Element( 'p' );

			writer.setCustomProperty( 'prop1', 'foo', el );

			expect( el.getCustomProperty( 'prop1' ) ).to.equal( 'foo' );
			expect( Array.from( el.getCustomProperties() ).length ).to.equal( 1 );

			writer.removeCustomProperty( 'prop1', el );

			expect( el.getCustomProperty( 'prop1' ) ).to.undefined;
			expect( Array.from( el.getCustomProperties() ).length ).to.equal( 0 );
		} );

		it( 'should have no effect if custom property does not exists', () => {
			const el = new Element( 'h1' );

			writer.removeCustomProperty( 'prop1', el );

			expect( el.getCustomProperty( 'prop1' ) ).to.undefined;
			expect( Array.from( el.getCustomProperties() ).length ).to.equal( 0 );
		} );
	} );
} );
