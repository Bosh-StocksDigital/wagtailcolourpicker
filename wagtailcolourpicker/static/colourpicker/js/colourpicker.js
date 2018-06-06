const React = window.React;
const EditorState = window.DraftJS.EditorState;
const Modifier = window.DraftJS.Modifier;
const RichUtils = window.DraftJS.RichUtils;

class TextColourSource extends React.Component {

    constructor(props) {
        super(props);

        this.onChosen = this.onChosen.bind(this);
        this.onAdded = this.onAdded.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    componentDidMount() {

        $(document.body).on('hidden.bs.modal', this.onClose);

        this.workflow = ModalWorkflow({
            url: window.chooserUrls.colourChooser,
            responses: {
                colourChosen: this.onChosen,
                colourAdded: this.onAdded
            }
        });
    }

    componentWillUnmount() {

        this.workflow = null;

        $(document.body).off('hidden.bs.modal', this.onClose);
    }

    onChosen(toggledColor, featuredColors) {
        // set the chosen colour, ensuring all other colours are unset

        const { editorState, onComplete } = this.props;
        const selection = editorState.getSelection();

        // Only allow one color to be set at a time for the current selection
        const nextContentState = featuredColors
            .reduce((contentState, color) => {
                return Modifier.removeInlineStyle(contentState, selection, color)
            }, editorState.getCurrentContent());

        var nextEditorState = EditorState.push(
            editorState,
            nextContentState,
            'change-inline-style'
        );

        const currentStyle = editorState.getCurrentInlineStyle();

        // Unset style override for current color.
        if (selection.isCollapsed()) {
            nextEditorState = currentStyle.reduce((state, color) => {
              return RichUtils.toggleInlineStyle(state, color);
            }, nextEditorState);
        }

        // If there's a color and it's being toggled on, apply it.
        if (toggledColor && !currentStyle.has(toggledColor)) {
            nextEditorState = RichUtils.toggleInlineStyle(
                nextEditorState,
                toggledColor
            );
        }

        this.workflow.close();

        onComplete(nextEditorState);
    }

    onAdded(featureName, color, created) {
        // if a new color was added add the new inline style so that
        // the colour changes are visible immediately

        if (created) {
            document.querySelectorAll('[data-draftail-input]').forEach(function (input) {
                input.draftailEditor.props.inlineStyles.push(
                    {
                        type: featureName,
                        label: 'C',
                        description: color,
                        style: {color: color}
                    }
                )
            });
        }
    }

    onClose(e) {
        e.preventDefault();
        const { onClose } = this.props;
        onClose();
    }

    render() {
        return null;
    }
}

window.draftail.registerPlugin({
    type: 'TEXTCOLOUR',
    source: TextColourSource,
});
