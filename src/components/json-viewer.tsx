import { Component, Prop, h, Element } from '@stencil/core';
import 'json-viewer-js'; // the web component automatically registers itself

@Component({
  tag: 'json-viewer',
  styleUrl: 'json-viewer.css',
  shadow: true,
})
export class JsonViewer {
  @Prop() data: any;
  @Element() el: HTMLElement;

  componentDidLoad() {
    if (this.data) {
      const viewer = document.createElement('json-viewer');
      viewer.data = this.data;
      viewer.setAttribute('theme', 'light');
      this.el.shadowRoot.appendChild(viewer);
    }
  }

  render() {
    return <div></div>;
  }
}
