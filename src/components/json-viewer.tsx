// json-viewer.tsx
import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'json-viewer',
  styleUrl: 'json-viewer.css',
  shadow: true,
})
export class JsonViewer {
  /**
   * The JSON data to display
   */
  @Prop() data: any;

  render() {
    if (!this.data) return null;

    return <pre>{JSON.stringify(this.data, null, 2)}</pre>;
  }
}
