import { BaseFilesView } from './base-files-view.js'
import { html } from 'beaker://app-stdlib/vendor/lit-element/lit-element.js'
import { classMap } from 'beaker://app-stdlib/vendor/lit-element/lit-html/directives/class-map.js'
import { timeDifference } from 'beaker://app-stdlib/js/time.js'
import './file-display.js'
import baseCSS from '../../css/com/base-files-view.css.js'
import inlineListCSS from '../../css/com/inline-file-list.css.js'

export class InlineFileList extends BaseFilesView {
  static get styles () {
    return [baseCSS, inlineListCSS]
  }

  renderItem (item) {
    var cls = classMap({
      item: true,
      selected: this.selection.includes(item)
    })
    var driveTitle = item.drive.title || 'Untitled'
    var folder = item.path.split('/').slice(0, -1).join('/') || '/'
    return html`
      <div
        class=${cls}
        @click=${e => this.onClickItem(e, item)}
        @dblclick=${e => this.onDblClickItem(e, item)}
        @contextmenu=${e => this.onContextMenuItem(e, item)}
        data-url=${item.url}
      >
        <div class="info">
          <div>
            <a class="name" href=${item.url}>
              ${this.showOrigin ? item.path : item.name}
            </a>
          </div>
          ${this.showOrigin ? html`
            <div>Drive: <a class="author" href=${item.drive.url}>${driveTitle}</a></div>
          ` : ''}
          <div>
            Updated: <span class="date">${timeDifference(item.stat.ctime, true, 'ago')}</span>
          </div>
        </div>
        <div class="content">
          <file-display
            horz
            drive-url=${item.drive.url}
            pathname=${item.path}
            .info=${item}
          ></file-display>
        </div>
      </div>
    `
  }
}

customElements.define('inline-file-list', InlineFileList)
