/**
 * Interactive UI controls for algorithm examples
 * Provides reusable components for parameter adjustment and algorithm control
 */

export class UIControls {
  constructor(containerElement) {
    this.container = containerElement;
    this.controls = new Map();
    this.callbacks = new Map();
  }
  
  /**
   * Create a control group with label
   * @param {string} id - Control group ID
   * @param {string} label - Label text
   * @returns {HTMLElement} Control group element
   */
  createControlGroup(id, label) {
    const group = document.createElement('div');
    group.className = 'control-group';
    group.id = id;
    
    if (label) {
      const labelElement = document.createElement('label');
      labelElement.textContent = label;
      labelElement.setAttribute('for', id);
      group.appendChild(labelElement);
    }
    
    this.container.appendChild(group);
    this.controls.set(id, { element: group, type: 'group' });
    
    return group;
  }
  
  /**
   * Add a range slider control
   * @param {string} groupId - Parent group ID
   * @param {string} id - Control ID
   * @param {Object} options - Slider options
   */
  addSlider(groupId, id, options = {}) {
    const {
      min = 0,
      max = 100,
      value = 50,
      step = 1,
      callback = null
    } = options;
    
    const group = this.controls.get(groupId)?.element;
    if (!group) return;
    
    const container = document.createElement('div');
    container.className = 'slider-container';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id;
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    
    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'range-value';
    valueDisplay.textContent = value;
    
    // Update display when slider changes
    slider.addEventListener('input', (e) => {
      const newValue = parseFloat(e.target.value);
      valueDisplay.textContent = newValue;
      
      if (callback) callback(newValue);
      
      const savedCallback = this.callbacks.get(id);
      if (savedCallback) savedCallback(newValue);
    });
    
    container.appendChild(slider);
    container.appendChild(valueDisplay);
    group.appendChild(container);
    
    this.controls.set(id, { 
      element: slider, 
      type: 'slider',
      valueDisplay 
    });
  }
  
  /**
   * Add a dropdown select control
   * @param {string} groupId - Parent group ID
   * @param {string} id - Control ID
   * @param {Object} options - Select options
   */
  addSelect(groupId, id, options = {}) {
    const {
      choices = [],
      value = null,
      callback = null
    } = options;
    
    const group = this.controls.get(groupId)?.element;
    if (!group) return;
    
    const select = document.createElement('select');
    select.id = id;
    
    choices.forEach(choice => {
      const option = document.createElement('option');
      option.value = choice.value || choice;
      option.textContent = choice.label || choice;
      
      if (value && (choice.value === value || choice === value)) {
        option.selected = true;
      }
      
      select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
      const newValue = e.target.value;
      
      if (callback) callback(newValue);
      
      const savedCallback = this.callbacks.get(id);
      if (savedCallback) savedCallback(newValue);
    });
    
    group.appendChild(select);
    this.controls.set(id, { element: select, type: 'select' });
  }
  
  /**
   * Add a number input control
   * @param {string} groupId - Parent group ID
   * @param {string} id - Control ID
   * @param {Object} options - Input options
   */
  addNumberInput(groupId, id, options = {}) {
    const {
      min = 1,
      max = 100,
      value = 10,
      callback = null
    } = options;
    
    const group = this.controls.get(groupId)?.element;
    if (!group) return;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.min = min;
    input.max = max;
    input.value = value;
    
    input.addEventListener('change', (e) => {
      const newValue = parseInt(e.target.value, 10);
      
      if (callback) callback(newValue);
      
      const savedCallback = this.callbacks.get(id);
      if (savedCallback) savedCallback(newValue);
    });
    
    group.appendChild(input);
    this.controls.set(id, { element: input, type: 'number' });
  }
  
  /**
   * Add a button control
   * @param {string} groupId - Parent group ID
   * @param {string} id - Control ID
   * @param {Object} options - Button options
   */
  addButton(groupId, id, options = {}) {
    const {
      text = 'Button',
      className = 'button',
      callback = null
    } = options;
    
    const group = this.controls.get(groupId)?.element;
    if (!group) return;
    
    const button = document.createElement('button');
    button.id = id;
    button.className = className;
    button.textContent = text;
    
    button.addEventListener('click', (e) => {
      if (callback) callback(e);
      
      const savedCallback = this.callbacks.get(id);
      if (savedCallback) savedCallback(e);
    });
    
    group.appendChild(button);
    this.controls.set(id, { element: button, type: 'button' });
  }
  
  /**
   * Add a button group
   * @param {string} groupId - Parent group ID
   * @param {string} id - Control ID
   * @param {Array} buttons - Array of button configurations
   */
  addButtonGroup(groupId, id, buttons = []) {
    const group = this.controls.get(groupId)?.element;
    if (!group) return;
    
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    buttonGroup.id = id;
    
    buttons.forEach((btnConfig, index) => {
      const button = document.createElement('button');
      button.className = btnConfig.className || 'button';
      button.textContent = btnConfig.text || `Button ${index + 1}`;
      button.id = `${id}-${index}`;
      
      if (btnConfig.callback) {
        button.addEventListener('click', btnConfig.callback);
      }
      
      buttonGroup.appendChild(button);
    });
    
    group.appendChild(buttonGroup);
    this.controls.set(id, { element: buttonGroup, type: 'button-group' });
  }
  
  /**
   * Set callback for a control
   * @param {string} id - Control ID
   * @param {Function} callback - Callback function
   */
  setCallback(id, callback) {
    this.callbacks.set(id, callback);
  }
  
  /**
   * Get control value
   * @param {string} id - Control ID
   * @returns {*} Control value
   */
  getValue(id) {
    const control = this.controls.get(id);
    if (!control) return null;
    
    switch (control.type) {
      case 'slider':
      case 'number':
        return parseFloat(control.element.value);
      case 'select':
        return control.element.value;
      default:
        return control.element.value;
    }
  }
  
  /**
   * Set control value
   * @param {string} id - Control ID
   * @param {*} value - New value
   */
  setValue(id, value) {
    const control = this.controls.get(id);
    if (!control) return;
    
    control.element.value = value;
    
    // Update range display if it's a slider
    if (control.type === 'slider' && control.valueDisplay) {
      control.valueDisplay.textContent = value;
    }
  }
  
  /**
   * Enable/disable a control
   * @param {string} id - Control ID
   * @param {boolean} enabled - Whether to enable the control
   */
  setEnabled(id, enabled) {
    const control = this.controls.get(id);
    if (!control) return;
    
    control.element.disabled = !enabled;
  }
  
  /**
   * Clear all controls
   */
  clear() {
    this.container.innerHTML = '';
    this.controls.clear();
    this.callbacks.clear();
  }
}

/**
 * Animation control panel
 */
export class AnimationControls {
  constructor(containerElement, animationController) {
    this.container = containerElement;
    this.controller = animationController;
    this.isPlaying = false;
    this.isPaused = false;
    
    this.setupControls();
    this.setupCallbacks();
  }
  
  setupControls() {
    this.container.innerHTML = `
      <div class="animation-controls">
        <button id="play-btn" class="button">▶ Play</button>
        <button id="pause-btn" class="button" disabled>⏸ Pause</button>
        <button id="stop-btn" class="button">⏹ Stop</button>
        <button id="step-btn" class="button">⏭ Step</button>
        <button id="reset-btn" class="button">🔄 Reset</button>
        
        <div class="speed-control">
          <label for="speed-slider">Speed:</label>
          <input type="range" id="speed-slider" min="100" max="2000" value="1000" step="100">
          <span id="speed-value">1000ms</span>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
        <div id="step-info">Step 0 of 0</div>
      </div>
    `;
    
    // Get references to buttons
    this.playBtn = this.container.querySelector('#play-btn');
    this.pauseBtn = this.container.querySelector('#pause-btn');
    this.stopBtn = this.container.querySelector('#stop-btn');
    this.stepBtn = this.container.querySelector('#step-btn');
    this.resetBtn = this.container.querySelector('#reset-btn');
    this.speedSlider = this.container.querySelector('#speed-slider');
    this.speedValue = this.container.querySelector('#speed-value');
    this.progressFill = this.container.querySelector('#progress-fill');
    this.stepInfo = this.container.querySelector('#step-info');
  }
  
  setupCallbacks() {
    this.playBtn.addEventListener('click', () => {
      if (!this.isPlaying || this.isPaused) {
        this.controller.play();
        this.updateButtonStates(true, false);
      }
    });
    
    this.pauseBtn.addEventListener('click', () => {
      if (this.isPlaying && !this.isPaused) {
        this.controller.pause();
        this.updateButtonStates(false, true);
      }
    });
    
    this.stopBtn.addEventListener('click', () => {
      this.controller.stop();
      this.updateButtonStates(false, false);
      this.updateProgress(0);
    });
    
    this.stepBtn.addEventListener('click', () => {
      this.controller.step();
      this.updateProgress();
    });
    
    this.resetBtn.addEventListener('click', () => {
      this.controller.reset();
      this.updateButtonStates(false, false);
      this.updateProgress(0);
    });
    
    this.speedSlider.addEventListener('input', (e) => {
      const speed = parseInt(e.target.value);
      this.speedValue.textContent = `${speed}ms`;
      this.controller.setSpeed(speed);
    });
    
    // Set up controller callbacks
    this.controller.onAnimationStart = () => {
      this.updateButtonStates(true, false);
    };
    
    this.controller.onAnimationComplete = () => {
      this.updateButtonStates(false, false);
    };
    
    this.controller.onStepComplete = (step, stepData) => {
      this.updateProgress();
      this.updateStepInfo(step + 1, this.controller.steps.length);
    };
  }
  
  updateButtonStates(playing, paused) {
    this.isPlaying = playing;
    this.isPaused = paused;
    
    this.playBtn.disabled = playing && !paused;
    this.pauseBtn.disabled = !playing || paused;
    this.stepBtn.disabled = playing && !paused;
    
    // Update play button text
    if (paused) {
      this.playBtn.textContent = '▶ Resume';
    } else {
      this.playBtn.textContent = '▶ Play';
    }
  }
  
  updateProgress(progress = null) {
    const currentProgress = progress !== null ? progress : this.controller.getProgress();
    this.progressFill.style.width = `${currentProgress}%`;
  }
  
  updateStepInfo(currentStep, totalSteps) {
    this.stepInfo.textContent = `Step ${currentStep} of ${totalSteps}`;
  }
  
  updateTotalSteps(totalSteps) {
    this.updateStepInfo(0, totalSteps);
  }
}

/**
 * Results display panel
 */
export class ResultsDisplay {
  constructor(containerElement) {
    this.container = containerElement;
    this.results = new Map();
  }
  
  /**
   * Add a result item
   * @param {string} key - Result key
   * @param {string} label - Display label
   * @param {*} value - Result value
   */
  addResult(key, label, value) {
    this.results.set(key, { label, value });
    this.render();
  }
  
  /**
   * Update a result item
   * @param {string} key - Result key
   * @param {*} value - New value
   */
  updateResult(key, value) {
    const result = this.results.get(key);
    if (result) {
      result.value = value;
      this.render();
    }
  }
  
  /**
   * Clear all results
   */
  clear() {
    this.results.clear();
    this.container.innerHTML = '';
  }
  
  /**
   * Render results display
   */
  render() {
    if (this.results.size === 0) {
      this.container.innerHTML = '<p>No results yet. Run an algorithm to see results.</p>';
      return;
    }
    
    const resultsHtml = Array.from(this.results.entries())
      .map(([key, { label, value }]) => `
        <div class="result-item">
          <strong>${label}:</strong> ${this.formatValue(value)}
        </div>
      `).join('');
    
    this.container.innerHTML = `
      <div class="results">
        <h3>Results</h3>
        <div class="results-grid">
          ${resultsHtml}
        </div>
      </div>
    `;
  }
  
  /**
   * Format value for display
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  formatValue(value) {
    if (Array.isArray(value)) {
      return value.length > 10 ? 
        `[${value.slice(0, 10).join(', ')}... (${value.length} total)]` :
        `[${value.join(', ')}]`;
    }
    
    if (typeof value === 'number') {
      return value === Infinity ? '∞' : 
             value % 1 === 0 ? value.toString() : 
             value.toFixed(2);
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  }
}

/**
 * Algorithm info panel
 */
export class AlgorithmInfo {
  constructor(containerElement) {
    this.container = containerElement;
  }
  
  /**
   * Display algorithm information
   * @param {Object} info - Algorithm info object
   */
  display(info) {
    const {
      name = 'Algorithm',
      description = 'No description available.',
      timeComplexity = 'Unknown',
      spaceComplexity = 'Unknown',
      applications = []
    } = info;
    
    this.container.innerHTML = `
      <div class="algorithm-description">
        <h3>${name}</h3>
        <p>${description}</p>
        
        ${applications.length > 0 ? `
          <h4>Applications:</h4>
          <ul>
            ${applications.map(app => `<li>${app}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
      
      <div class="complexity-info">
        <div class="complexity-item">
          <h4>Time Complexity</h4>
          <p>${timeComplexity}</p>
        </div>
        <div class="complexity-item">
          <h4>Space Complexity</h4>
          <p>${spaceComplexity}</p>
        </div>
      </div>
    `;
  }
  
  /**
   * Clear info display
   */
  clear() {
    this.container.innerHTML = '';
  }
}