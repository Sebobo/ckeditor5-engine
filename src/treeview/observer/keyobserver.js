/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import DomEventObserver from './domeventobserver.js';

/**
 * {@link engine.treeView.TreeView#keydown Key down} event observer.
 *
 * @memberOf engine.treeView.observer
 * @extends engine.treeView.observer.DomEventObserver
 */
export default class KeyObserver extends DomEventObserver {
	constructor( treeView ) {
		super( treeView );

		this.domEventType = 'keydown';
	}

	onDomEvent( domEvt ) {
		const treeView = this.treeView;

		this.fire( 'keydown', {
			keyCode: domEvt.keyCode,

			altKey: domEvt.altKey,
			ctrlKey: domEvt.ctrlKey || domEvt.metaKey,
			shiftKey: domEvt.shiftKey,

			get target() {
				return treeView.domConverter.getCorrespondingViewElement( domEvt.target );
			},

			domTarget: domEvt.target
		} );
	}
}

/**
 * Fired when a key has been pressed.
 *
 * @event engine.treeView.TreeView#keydown
 * @param {engine.treeView.observer.keyObserver.KeyData} keyData
 */

/**
 * The value of the {@link engine.treeView.TreeView#keydown} event.
 *
 * @interface engine.treeView.observer.keyObserver.KeyData
 * @implements utils.keyboard.KeystrokeInfo
 */

/**
 * The event view target.
 *
 * @member {engine.treeView.Element} engine.treeView.observer.keyObserver.KeyData#target
 */

/**
 * The event DOM target.
 *
 * @member {HTMLElement} engine.treeView.observer.keyObserver.KeyData#domTarget
 */