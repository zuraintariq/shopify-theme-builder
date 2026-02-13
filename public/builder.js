// Theme Builder - Main JavaScript

class ThemeBuilder {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.propertiesPanel = document.getElementById('propertiesContent');
    this.selectedElement = null;
    this.elements = [];
    this.history = [];
    this.historyIndex = -1;
    this.idCounter = 0;
    
    this.init();
  }
  
  init() {
    this.setupDragAndDrop();
    this.setupToolbar();
    this.setupModal();
    this.setupKeyboard();
  }
  
  // Element definitions
  getElementTemplate(type) {
    const templates = {
      section: {
        tag: 'section',
        class: 'el-section',
        canContain: true,
        defaultContent: '',
        label: 'Section'
      },
      container: {
        tag: 'div',
        class: 'el-container',
        canContain: true,
        defaultContent: '',
        label: 'Container'
      },
      row: {
        tag: 'div',
        class: 'el-row',
        canContain: true,
        defaultContent: '',
        label: 'Row'
      },
      column: {
        tag: 'div',
        class: 'el-column',
        canContain: true,
        defaultContent: '',
        label: 'Column'
      },
      heading: {
        tag: 'h2',
        class: 'el-heading',
        canContain: false,
        defaultContent: 'Heading Text',
        label: 'Heading'
      },
      text: {
        tag: 'span',
        class: 'el-text',
        canContain: false,
        defaultContent: 'Text content',
        label: 'Text'
      },
      paragraph: {
        tag: 'p',
        class: 'el-paragraph',
        canContain: false,
        defaultContent: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
        label: 'Paragraph'
      },
      image: {
        tag: 'div',
        class: 'el-image',
        canContain: false,
        defaultContent: '🖼 Image Placeholder',
        label: 'Image'
      },
      button: {
        tag: 'a',
        class: 'el-button',
        canContain: false,
        defaultContent: 'Button',
        label: 'Button'
      },
      link: {
        tag: 'a',
        class: 'el-link',
        canContain: false,
        defaultContent: 'Link Text',
        label: 'Link'
      },
      spacer: {
        tag: 'div',
        class: 'el-spacer',
        canContain: false,
        defaultContent: '',
        label: 'Spacer'
      },
      divider: {
        tag: 'hr',
        class: 'el-divider',
        canContain: false,
        defaultContent: '',
        label: 'Divider'
      },
      list: {
        tag: 'ul',
        class: 'el-list',
        canContain: false,
        defaultContent: '<li>List item 1</li><li>List item 2</li><li>List item 3</li>',
        label: 'List'
      },
      video: {
        tag: 'div',
        class: 'el-video',
        canContain: false,
        defaultContent: '▶ Video Placeholder',
        label: 'Video'
      },
      icon: {
        tag: 'span',
        class: 'el-icon',
        canContain: false,
        defaultContent: '★',
        label: 'Icon'
      },
      input: {
        tag: 'input',
        class: 'el-input',
        canContain: false,
        defaultContent: '',
        label: 'Input'
      }
    };
    return templates[type] || templates.text;
  }
  
  // Create element
  createElement(type, parent = null) {
    const template = this.getElementTemplate(type);
    const id = `el-${++this.idCounter}`;
    
    const wrapper = document.createElement('div');
    wrapper.className = `canvas-element ${template.class}`;
    wrapper.dataset.id = id;
    wrapper.dataset.type = type;
    
    // Label
    const label = document.createElement('span');
    label.className = 'element-label';
    label.textContent = template.label;
    wrapper.appendChild(label);
    
    // Content
    if (template.tag === 'input') {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Input placeholder';
      input.style.pointerEvents = 'none';
      wrapper.appendChild(input);
    } else if (template.defaultContent) {
      wrapper.innerHTML += template.defaultContent;
    }
    
    // Make droppable if container
    if (template.canContain) {
      wrapper.dataset.container = 'true';
    }
    
    // Add click handler
    wrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectElement(wrapper);
    });
    
    // Add to canvas or parent
    const target = parent || this.canvas;
    target.appendChild(wrapper);
    
    // Update canvas state
    this.canvas.classList.add('has-content');
    
    // Save to history
    this.saveHistory();
    
    return wrapper;
  }
  
  // Select element
  selectElement(el) {
    // Deselect previous
    if (this.selectedElement) {
      this.selectedElement.classList.remove('selected');
    }
    
    this.selectedElement = el;
    
    if (el) {
      el.classList.add('selected');
      this.showProperties(el);
    } else {
      this.hideProperties();
    }
  }
  
  // Show properties panel
  showProperties(el) {
    const type = el.dataset.type;
    const template = this.getElementTemplate(type);
    
    let html = `
      <div class="property-group">
        <h4>Element</h4>
        <div class="property-row">
          <label>Type</label>
          <input type="text" value="${template.label}" disabled>
        </div>
        <div class="property-row">
          <label>ID</label>
          <input type="text" id="prop-id" value="${el.dataset.customId || ''}" placeholder="custom-id">
        </div>
        <div class="property-row">
          <label>Class</label>
          <input type="text" id="prop-class" value="${el.dataset.customClass || ''}" placeholder="custom-class">
        </div>
      </div>
    `;
    
    // Content for text elements
    if (['heading', 'text', 'paragraph', 'button', 'link'].includes(type)) {
      const content = el.innerText || el.textContent;
      html += `
        <div class="property-group">
          <h4>Content</h4>
          <div class="property-row">
            <label>Text</label>
            <textarea id="prop-content">${content}</textarea>
          </div>
        </div>
      `;
    }
    
    // Link URL
    if (['button', 'link'].includes(type)) {
      html += `
        <div class="property-group">
          <h4>Link</h4>
          <div class="property-row">
            <label>URL</label>
            <input type="text" id="prop-href" value="${el.dataset.href || '#'}" placeholder="https://...">
          </div>
        </div>
      `;
    }
    
    // Image source
    if (type === 'image') {
      html += `
        <div class="property-group">
          <h4>Image</h4>
          <div class="property-row">
            <label>Source URL</label>
            <input type="text" id="prop-src" value="${el.dataset.src || ''}" placeholder="Image URL or {{ image }}">
          </div>
          <div class="property-row">
            <label>Alt Text</label>
            <input type="text" id="prop-alt" value="${el.dataset.alt || ''}" placeholder="Image description">
          </div>
        </div>
      `;
    }
    
    // Spacing
    html += `
      <div class="property-group">
        <h4>Spacing</h4>
        <div class="property-row">
          <label>Padding (px)</label>
          <div class="property-grid">
            <input type="number" id="prop-pt" placeholder="Top" value="${el.dataset.pt || ''}">
            <input type="number" id="prop-pr" placeholder="Right" value="${el.dataset.pr || ''}">
            <input type="number" id="prop-pb" placeholder="Bottom" value="${el.dataset.pb || ''}">
            <input type="number" id="prop-pl" placeholder="Left" value="${el.dataset.pl || ''}">
          </div>
        </div>
        <div class="property-row">
          <label>Margin (px)</label>
          <div class="property-grid">
            <input type="number" id="prop-mt" placeholder="Top" value="${el.dataset.mt || ''}">
            <input type="number" id="prop-mr" placeholder="Right" value="${el.dataset.mr || ''}">
            <input type="number" id="prop-mb" placeholder="Bottom" value="${el.dataset.mb || ''}">
            <input type="number" id="prop-ml" placeholder="Left" value="${el.dataset.ml || ''}">
          </div>
        </div>
      </div>
    `;
    
    // Colors
    html += `
      <div class="property-group">
        <h4>Colors</h4>
        <div class="property-row">
          <label>Background</label>
          <div class="color-input">
            <input type="color" id="prop-bg-color" value="${el.dataset.bgColor || '#ffffff'}">
            <input type="text" id="prop-bg-color-text" value="${el.dataset.bgColor || ''}" placeholder="transparent">
          </div>
        </div>
        <div class="property-row">
          <label>Text Color</label>
          <div class="color-input">
            <input type="color" id="prop-text-color" value="${el.dataset.textColor || '#333333'}">
            <input type="text" id="prop-text-color-text" value="${el.dataset.textColor || ''}" placeholder="inherit">
          </div>
        </div>
      </div>
    `;
    
    // Typography
    if (['heading', 'text', 'paragraph'].includes(type)) {
      html += `
        <div class="property-group">
          <h4>Typography</h4>
          <div class="property-row">
            <label>Font Size (px)</label>
            <input type="number" id="prop-font-size" value="${el.dataset.fontSize || ''}" placeholder="16">
          </div>
          <div class="property-row">
            <label>Font Weight</label>
            <select id="prop-font-weight">
              <option value="">Default</option>
              <option value="300" ${el.dataset.fontWeight === '300' ? 'selected' : ''}>Light (300)</option>
              <option value="400" ${el.dataset.fontWeight === '400' ? 'selected' : ''}>Normal (400)</option>
              <option value="500" ${el.dataset.fontWeight === '500' ? 'selected' : ''}>Medium (500)</option>
              <option value="600" ${el.dataset.fontWeight === '600' ? 'selected' : ''}>Semi-bold (600)</option>
              <option value="700" ${el.dataset.fontWeight === '700' ? 'selected' : ''}>Bold (700)</option>
            </select>
          </div>
          <div class="property-row">
            <label>Text Align</label>
            <select id="prop-text-align">
              <option value="">Default</option>
              <option value="left" ${el.dataset.textAlign === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${el.dataset.textAlign === 'center' ? 'selected' : ''}>Center</option>
              <option value="right" ${el.dataset.textAlign === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        </div>
      `;
    }
    
    // Border
    html += `
      <div class="property-group">
        <h4>Border</h4>
        <div class="property-row">
          <label>Border Radius (px)</label>
          <input type="number" id="prop-border-radius" value="${el.dataset.borderRadius || ''}" placeholder="0">
        </div>
      </div>
    `;
    
    this.propertiesPanel.innerHTML = html;
    this.setupPropertyListeners();
  }
  
  hideProperties() {
    this.propertiesPanel.innerHTML = '<p class="properties-empty">Select an element to edit its properties</p>';
  }
  
  // Setup property change listeners
  setupPropertyListeners() {
    const el = this.selectedElement;
    if (!el) return;
    
    // Content
    const contentInput = document.getElementById('prop-content');
    if (contentInput) {
      contentInput.addEventListener('input', (e) => {
        const label = el.querySelector('.element-label');
        el.innerHTML = '';
        if (label) el.appendChild(label);
        el.innerHTML += e.target.value;
        this.saveHistory();
      });
    }
    
    // All other properties
    const props = ['id', 'class', 'href', 'src', 'alt', 'pt', 'pr', 'pb', 'pl', 'mt', 'mr', 'mb', 'ml', 
                   'bg-color', 'bg-color-text', 'text-color', 'text-color-text', 
                   'font-size', 'font-weight', 'text-align', 'border-radius'];
    
    props.forEach(prop => {
      const input = document.getElementById(`prop-${prop}`);
      if (input) {
        input.addEventListener('change', () => this.applyProperty(prop));
        input.addEventListener('input', () => this.applyProperty(prop));
      }
    });
  }
  
  applyProperty(prop) {
    const el = this.selectedElement;
    if (!el) return;
    
    const input = document.getElementById(`prop-${prop}`);
    if (!input) return;
    
    const value = input.value;
    
    // Store in dataset
    const dataKey = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    el.dataset[dataKey] = value;
    
    // Apply visual styles
    switch(prop) {
      case 'pt': el.style.paddingTop = value ? `${value}px` : ''; break;
      case 'pr': el.style.paddingRight = value ? `${value}px` : ''; break;
      case 'pb': el.style.paddingBottom = value ? `${value}px` : ''; break;
      case 'pl': el.style.paddingLeft = value ? `${value}px` : ''; break;
      case 'mt': el.style.marginTop = value ? `${value}px` : ''; break;
      case 'mr': el.style.marginRight = value ? `${value}px` : ''; break;
      case 'mb': el.style.marginBottom = value ? `${value}px` : ''; break;
      case 'ml': el.style.marginLeft = value ? `${value}px` : ''; break;
      case 'bg-color':
      case 'bg-color-text':
        el.style.backgroundColor = value || '';
        el.dataset.bgColor = value;
        break;
      case 'text-color':
      case 'text-color-text':
        el.style.color = value || '';
        el.dataset.textColor = value;
        break;
      case 'font-size':
        el.style.fontSize = value ? `${value}px` : '';
        break;
      case 'font-weight':
        el.style.fontWeight = value || '';
        break;
      case 'text-align':
        el.style.textAlign = value || '';
        break;
      case 'border-radius':
        el.style.borderRadius = value ? `${value}px` : '';
        break;
    }
    
    this.saveHistory();
  }
  
  // Delete selected element
  deleteSelected() {
    if (this.selectedElement) {
      this.selectedElement.remove();
      this.selectedElement = null;
      this.hideProperties();
      this.saveHistory();
      
      // Check if canvas is empty
      if (this.canvas.querySelectorAll('.canvas-element').length === 0) {
        this.canvas.classList.remove('has-content');
      }
    }
  }
  
  // Drag and Drop
  setupDragAndDrop() {
    // Sidebar elements
    document.querySelectorAll('.element-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('elementType', item.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });
    
    // Canvas drop
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      
      // Find drop target
      const target = this.findDropTarget(e.target);
      this.highlightDropTarget(target);
    });
    
    this.canvas.addEventListener('dragleave', (e) => {
      this.clearDropHighlight();
    });
    
    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      this.clearDropHighlight();
      
      const type = e.dataTransfer.getData('elementType');
      if (type) {
        const target = this.findDropTarget(e.target);
        const parent = target && target.dataset.container === 'true' ? target : null;
        this.createElement(type, parent);
      }
    });
    
    // Click outside to deselect
    this.canvas.addEventListener('click', (e) => {
      if (e.target === this.canvas) {
        this.selectElement(null);
      }
    });
  }
  
  findDropTarget(el) {
    while (el && el !== this.canvas) {
      if (el.classList && el.classList.contains('canvas-element')) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }
  
  highlightDropTarget(target) {
    this.clearDropHighlight();
    if (target && target.dataset.container === 'true') {
      target.classList.add('drop-target');
    }
  }
  
  clearDropHighlight() {
    document.querySelectorAll('.drop-target').forEach(el => {
      el.classList.remove('drop-target');
    });
  }
  
  // Toolbar
  setupToolbar() {
    document.getElementById('deleteElement').addEventListener('click', () => {
      this.deleteSelected();
    });
    
    document.getElementById('undoBtn').addEventListener('click', () => this.undo());
    document.getElementById('redoBtn').addEventListener('click', () => this.redo());
    
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.showExportModal();
    });
    
    document.getElementById('viewportSelect').addEventListener('change', (e) => {
      const container = document.querySelector('.canvas-container');
      container.className = 'canvas-container';
      if (e.target.value !== 'desktop') {
        container.classList.add(`viewport-${e.target.value}`);
      }
    });
  }
  
  // History
  saveHistory() {
    const state = this.canvas.innerHTML;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);
    this.historyIndex = this.history.length - 1;
  }
  
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.canvas.innerHTML = this.history[this.historyIndex];
      this.reattachListeners();
    }
  }
  
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.canvas.innerHTML = this.history[this.historyIndex];
      this.reattachListeners();
    }
  }
  
  reattachListeners() {
    this.canvas.querySelectorAll('.canvas-element').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectElement(el);
      });
    });
  }
  
  // Keyboard shortcuts
  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedElement && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          this.deleteSelected();
        }
      }
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          this.undo();
        }
        if (e.key === 'y') {
          e.preventDefault();
          this.redo();
        }
      }
    });
  }
  
  // Export Modal
  setupModal() {
    const modal = document.getElementById('exportModal');
    const closeBtn = document.getElementById('closeModal');
    const tabs = document.querySelectorAll('.export-tab');
    const copyBtn = document.getElementById('copyCode');
    
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.getElementById('liquidCode').style.display = tab.dataset.tab === 'liquid' ? 'block' : 'none';
        document.getElementById('cssCode').style.display = tab.dataset.tab === 'css' ? 'block' : 'none';
      });
    });
    
    copyBtn.addEventListener('click', () => {
      const activeTab = document.querySelector('.export-tab.active').dataset.tab;
      const code = activeTab === 'liquid' 
        ? document.getElementById('liquidCode').textContent
        : document.getElementById('cssCode').textContent;
      
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => copyBtn.textContent = '📋 Copy Code', 2000);
      });
    });
  }
  
  showExportModal() {
    const sectionName = document.getElementById('sectionName').value || 'custom-section';
    const { liquid, css } = this.generateCode(sectionName);
    
    document.getElementById('liquidCode').textContent = liquid;
    document.getElementById('cssCode').textContent = css;
    document.getElementById('exportModal').classList.add('active');
  }
  
  // Code Generation
  generateCode(sectionName) {
    const elements = this.canvas.querySelectorAll('.canvas-element');
    let liquidContent = '';
    let cssContent = '';
    let cssRules = new Set();
    
    const processElement = (el, indent = '') => {
      const type = el.dataset.type;
      const template = this.getElementTemplate(type);
      const customId = el.dataset.customId;
      const customClass = el.dataset.customClass;
      
      let tag = template.tag;
      let classes = [template.class];
      if (customClass) classes.push(customClass);
      
      let attrs = `class="${classes.join(' ')}"`;
      if (customId) attrs += ` id="${customId}"`;
      if (el.dataset.href) attrs += ` href="${el.dataset.href}"`;
      
      // Get content (excluding label)
      let content = '';
      el.childNodes.forEach(node => {
        if (node.nodeType === 3) {
          content += node.textContent;
        } else if (node.classList && !node.classList.contains('element-label')) {
          if (node.classList.contains('canvas-element')) {
            content += processElement(node, indent + '  ');
          } else {
            content += node.outerHTML || node.textContent;
          }
        }
      });
      
      // Generate CSS for custom styles
      const selector = customId ? `#${customId}` : `.${template.class}`;
      let styles = [];
      
      if (el.dataset.pt) styles.push(`padding-top: ${el.dataset.pt}px`);
      if (el.dataset.pr) styles.push(`padding-right: ${el.dataset.pr}px`);
      if (el.dataset.pb) styles.push(`padding-bottom: ${el.dataset.pb}px`);
      if (el.dataset.pl) styles.push(`padding-left: ${el.dataset.pl}px`);
      if (el.dataset.mt) styles.push(`margin-top: ${el.dataset.mt}px`);
      if (el.dataset.mr) styles.push(`margin-right: ${el.dataset.mr}px`);
      if (el.dataset.mb) styles.push(`margin-bottom: ${el.dataset.mb}px`);
      if (el.dataset.ml) styles.push(`margin-left: ${el.dataset.ml}px`);
      if (el.dataset.bgColor) styles.push(`background-color: ${el.dataset.bgColor}`);
      if (el.dataset.textColor) styles.push(`color: ${el.dataset.textColor}`);
      if (el.dataset.fontSize) styles.push(`font-size: ${el.dataset.fontSize}px`);
      if (el.dataset.fontWeight) styles.push(`font-weight: ${el.dataset.fontWeight}`);
      if (el.dataset.textAlign) styles.push(`text-align: ${el.dataset.textAlign}`);
      if (el.dataset.borderRadius) styles.push(`border-radius: ${el.dataset.borderRadius}px`);
      
      if (styles.length > 0) {
        cssRules.add(`${selector} {\n  ${styles.join(';\n  ')};\n}`);
      }
      
      if (tag === 'hr' || tag === 'input') {
        return `${indent}<${tag} ${attrs}>\n`;
      }
      
      return `${indent}<${tag} ${attrs}>\n${indent}  ${content.trim()}\n${indent}</${tag}>\n`;
    };
    
    elements.forEach(el => {
      if (!el.parentElement.classList.contains('canvas-element')) {
        liquidContent += processElement(el);
      }
    });
    
    cssRules.forEach(rule => cssContent += rule + '\n\n');
    
    const liquid = `{{ '${sectionName}.css' | asset_url | stylesheet_tag }}

<div class="${sectionName}-wrapper">
${liquidContent}
</div>

{% schema %}
{
  "name": "${sectionName}",
  "settings": [],
  "presets": [
    {
      "name": "${sectionName}"
    }
  ]
}
{% endschema %}`;

    // UPDATED EXPORT CSS FOR RESPONSIVENESS
    const css = `/* ${sectionName} Styles */
.${sectionName}-wrapper {
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Base Responsive Grid (Automatically Exported) */
.${sectionName}-wrapper .el-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
}

.${sectionName}-wrapper .el-column {
  flex: 1 1 0%;
  min-width: 0;
  box-sizing: border-box;
}

/* Mobile Breakpoint for Live Store */
@media screen and (max-width: 768px) {
  .${sectionName}-wrapper .el-row {
    flex-direction: column !important;
  }
  .${sectionName}-wrapper .el-column {
    width: 100% !important;
    flex: none !important;
  }
}

${cssContent}`;

    return { liquid, css };
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.builder = new ThemeBuilder();
});
