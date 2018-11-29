import React, { Component, Fragment } from 'react';
import { Editor, getEventRange, getEventTransfer } from 'slate-react'
import { Block, Value } from 'slate'

import InitialValue from '../utils/InitialValue';

import Icon from 'react-icons-kit';
import { bold } from 'react-icons-kit/feather/bold';
import { italic } from 'react-icons-kit/feather/italic';
import { code } from 'react-icons-kit/feather/code';
import { list } from 'react-icons-kit/feather/list';
import { underline } from 'react-icons-kit/feather/underline';
import { image } from 'react-icons-kit/feather/image';
import { ic_title } from 'react-icons-kit/md/ic_title';
import { ic_format_quote } from 'react-icons-kit/md/ic_format_quote';
import { BoldMark, ItalicMark, FormatToolbar } from './index';


const schema = {
	document: {
	    last: { type: 'paragraph' },
	    normalize: (editor, { code, node, child }) => {
	      	switch (code) {
	        	case 'last_child_type_invalid': {
	          		const paragraph = Block.create('paragraph')
	          		return editor.insertNodeByKey(node.key, node.nodes.size, paragraph)
	        	}
	      	}
	    },
	},
	blocks: {
		image: {
	      	isVoid: true,
	    },
	},
}
var mem = {};

export default class TextEditor extends Component {
	state = {
		value: InitialValue,
	};

	// On change, update the app's React state with the new editor value.
	onChange = ({ value }) => {
		this.setState({ value });
	};

	onKeyDown = (e, change) => {
		/*
			we want all our commands to start with the user pressing ctrl,
			if they don't--we cancel the action.
		*/

		if (!e.ctrlKey) {
			return;
		}

		e.preventDefault();

		/* Decide what to do based on the key code... */
		switch (e.key) {
			/* When "b" is pressed, add a "bold" mark to the text. */
			case 'b': {
				change.toggleMark('bold');
				return true;
			}
			case 'i': {
				change.toggleMark('italic');
				return true;
			}

			case 'c': {
				change.toggleMark('code');
				return true;
			}

			case 'l': {
				change.toggleMark('list');
				return true;
			}

			case 'u': {
				change.toggleMark('underline');
				return true;
			}

			case 'q': {
				change.toggleMark('quote');
				return true;
			}

			case 'h': {
				change.toggleMark('title');
				return true;
			}

			default: {
				return;
			}
		}
	};

	renderNode = (props, editor, next) => {
	    const { attributes, node, isFocused } = props

	    switch (node.type) {
	     	case 'image': {
	        	const src = node.data.get('src')
	        	return <img alt="image" src={src} selected={isFocused} {...attributes} />
	    	}
	      	default: {
	        	return null
	      	}
	    }
	}

	renderMark = (props) => {
		switch (props.mark.type) {
			case 'bold':
				return <BoldMark {...props} />;

			case 'italic':
				return <ItalicMark {...props} />;

			case 'code':
				return <code {...props.attributes}>{props.children}</code>;

			case 'list':
				return (
					<ul {...props.attributes}>
						<li>{props.children}</li>
					</ul>
				);

			case 'underline':
				return <u {...props.attributes}>{props.children}</u>;

			case 'quote':
				return <blockquote {...props.attributes}>{props.children}</blockquote>;

			case 'title':
				return <h1 {...props.attributes}>{props.children}</h1>;

			default: {
				return;
			}
		}
	};

	hasMark = type => {
	    const { value } = this.state
		if (value === undefined) return null;
	    if (value.activeMarks === undefined) return null;
		return value.activeMarks.some(mark => mark.type === type)
	}

	onClickImage = event => {
	    event.preventDefault()
		const { value } = this.state;
		const change = value.change();
		for (const file of event.target.files) {
	        const reader = new FileReader()
	        const [mime] = file.type.split('/')
	        if (mime !== 'image') continue

	        reader.onload = (e) => {
				var src = e.target.result;
				change.insertBlock({
				  	type: 'image',
				  	data: { src },
				});
				this.onChange(change);
	        }
			reader.readAsDataURL(file);
	    }
		event.target.value = null;
	}

	onMarkClick = (e, type) => {
		/* disabling browser default behavior like page refresh, etc */
		e.preventDefault();

		/* grabbing the this.state.value */
		const { value } = this.state;

		/*
			applying the formatting on the selected text
			which the desired formatting
		*/
		const change = value.change().toggleMark(type);

		/* calling the  onChange method we declared */
		this.onChange(change);
	};

	renderMarkIcon = (type, icon) => (
		<button
			onPointerDown={(e) => this.onMarkClick(e, type)}
			className=  {this.hasMark(type) && type !== 'image' ? "tooltip-icon-button icon-active" : "tooltip-icon-button"}
		>
			<Icon icon={icon} />
		</button>
	);

	renderImageIcon = (type, icon) => (
		<div className="image-upload">
		  <label htmlFor="file-input" className=" image-icon">
		    <Icon icon={icon} className="tooltip-icon-button" />
		  </label>

		  <input id="file-input" accept="image/*" type="file" onChange={(e) => this.onClickImage(e)} />
		</div>
	);

	save = (e) => {
		localStorage.setItem("state", JSON.stringify(this.state.value));
	}

	cancel = (e) => {
		this.setState({value: Value.fromJSON(JSON.parse(localStorage.getItem('state')))});
	}

	render() {
		return (
			<Fragment>
				<FormatToolbar>
					{this.renderMarkIcon('title', ic_title)}
					{this.renderMarkIcon('bold', bold)}
					{this.renderMarkIcon('italic', italic)}
					{this.renderMarkIcon('code', code)}
					{this.renderMarkIcon('list', list)}
					{this.renderMarkIcon('underline', underline)}
					{this.renderMarkIcon('quote', ic_format_quote)}
					{this.renderImageIcon('image', image)}
					<button onClick={(e)=>{this.save(e)}}>Save</button>
					<button onClick={(e)=>{this.cancel(e)}}>Cancel</button>
				</FormatToolbar>
				<Editor
					value={this.state.value}
					schema={schema}
					onChange={this.onChange}
					onKeyDown={this.onKeyDown}
					renderMark={this.renderMark}
					renderNode={this.renderNode}
				/>
			</Fragment>
		);
	}
}
