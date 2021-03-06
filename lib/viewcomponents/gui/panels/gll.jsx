var React = require('react');
var CodePanel = require('./codePanel.jsx');

var GCLPanel = React.createClass({
  componentDidMount: function() {
    this.props.model.after('layoutTextChange', this._onTextChange, this);
  },

  _onTextChange: function(e) {
    this.setState({
      code: e.newVal
    });
  },

  getInitialState: function() {
    var code = this.props.model.get('layoutText');
    return {
      code: code
    };
  },

  render: function() {
   return (
      <CodePanel code={this.state.code} changesApplied={this._apply}/>
    );
  },

  _apply: function(text) {
    this.props.model.set('layoutText', text);
  }
});

module.exports = GCLPanel;
