import { invoke } from '@tauri-apps/api/core';

// System status interface matching Rust backend
interface VoiceSystemStatus {
  nerd_dictation: boolean;
  xdotool: boolean;
  vosk_model_small: boolean;
  vosk_model_large: boolean;
  microphone: boolean;
}

// State management
interface AppState {
  isRecording: boolean;
  text: string;
  isInitialized: boolean;
  systemStatus: VoiceSystemStatus | null;
  settings: {
    autoPunctuation: boolean;
    numbersAsDigits: boolean;
    autoInsert: boolean;
    timeout: number;
    modelSize: 'small' | 'large';
  };
}

const state: AppState = {
  isRecording: false,
  text: '',
  isInitialized: false,
  systemStatus: null,
  settings: {
    autoPunctuation: true,
    numbersAsDigits: false,
    autoInsert: false,
    timeout: 5,
    modelSize: 'small',
  },
};

// DOM Elements
const recordButton = document.getElementById('recordButton') as HTMLButtonElement;
const outputText = document.getElementById('outputText') as HTMLTextAreaElement;
const statusIndicator = document.getElementById('statusIndicator') as HTMLDivElement;
const statusText = statusIndicator?.querySelector('.status-text') as HTMLSpanElement;
const statusDot = statusIndicator?.querySelector('.status-dot') as HTMLSpanElement;
const waveform = document.getElementById('waveform') as HTMLDivElement;
const copyButton = document.getElementById('copyButton') as HTMLButtonElement;
const clearButton = document.getElementById('clearButton') as HTMLButtonElement;
const insertButton = document.getElementById('insertButton') as HTMLButtonElement;
const settingsToggle = document.getElementById('settingsToggle') as HTMLButtonElement;
const commandsToggle = document.getElementById('commandsToggle') as HTMLButtonElement;
const settingsPanel = document.getElementById('settingsPanel') as HTMLDivElement;
const commandsPanel = document.querySelector('.commands-panel') as HTMLDivElement;

// Settings inputs
const autoPunctuationInput = document.getElementById('autoPunctuation') as HTMLInputElement;
const numbersAsDigitsInput = document.getElementById('numbersAsDigits') as HTMLInputElement;
const autoInsertInput = document.getElementById('autoInsert') as HTMLInputElement;
const timeoutInput = document.getElementById('timeout') as HTMLInputElement;
const modelSizeInput = document.getElementById('modelSize') as HTMLSelectElement;
const timeoutValue = document.querySelector('.timeout-value') as HTMLSpanElement;

// Update status indicator
function updateStatus(status: 'ready' | 'recording' | 'processing' | 'error', message: string) {
  if (!statusText || !statusDot) return;

  statusText.textContent = message;

  const colors = {
    ready: '#10b981',
    recording: '#ef4444',
    processing: '#f59e0b',
    error: '#dc2626',
  };

  statusDot.style.background = colors[status];
}

// Recording toggle
async function toggleRecording() {
  if (!recordButton) return;

  // Check if system is initialized
  if (!state.isInitialized) {
    updateStatus('error', 'System not initialized');
    showErrorNotification('Please wait for system initialization to complete');
    return;
  }

  if (state.isRecording) {
    // Stop recording
    try {
      updateStatus('processing', 'Processing...');
      recordButton.classList.remove('recording');
      recordButton.disabled = true;
      waveform?.classList.remove('active');

      const result = await invoke<string>('stop_recording');

      if (result && result.trim()) {
        state.text += (state.text ? ' ' : '') + result.trim();
        outputText.value = state.text;

        if (state.settings.autoInsert) {
          await insertText();
        }
      } else {
        showErrorNotification('No speech detected. Please try again.');
      }

      state.isRecording = false;
      recordButton.disabled = false;
      updateStatus('ready', 'Ready');
    } catch (error) {
      console.error('Error stopping recording:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      updateStatus('error', 'Recording failed');
      showErrorNotification(`Failed to stop recording: ${errorMsg}`);
      state.isRecording = false;
      recordButton.disabled = false;
      recordButton.classList.remove('recording');
      waveform?.classList.remove('active');
    }
  } else {
    // Validate system dependencies before starting
    if (!validateSystemDependencies()) {
      return;
    }

    // Start recording
    try {
      updateStatus('recording', 'Listening...');
      recordButton.classList.add('recording');
      recordButton.disabled = true;
      waveform?.classList.add('active');

      await invoke('start_recording', {
        config: {
          timeout: state.settings.timeout,
          model_size: state.settings.modelSize,
          auto_punctuation: state.settings.autoPunctuation,
          numbers_as_digits: state.settings.numbersAsDigits,
        }
      });

      state.isRecording = true;
      recordButton.disabled = false;
    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      updateStatus('error', 'Failed to start');
      showErrorNotification(`Failed to start recording: ${errorMsg}`);
      recordButton.classList.remove('recording');
      recordButton.disabled = false;
      waveform?.classList.remove('active');
    }
  }
}

// Copy text to clipboard
async function copyText() {
  if (!state.text || state.text.trim() === '') {
    showErrorNotification('No text to copy');
    return;
  }

  try {
    await navigator.clipboard.writeText(state.text);
    updateStatus('ready', 'Copied!');
    showSuccessNotification('Text copied to clipboard');
    setTimeout(() => updateStatus('ready', 'Ready'), 2000);
  } catch (error) {
    console.error('Error copying text:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    updateStatus('error', 'Copy failed');
    showErrorNotification(`Failed to copy text: ${errorMsg}`);
  }
}

// Clear text
function clearText() {
  state.text = '';
  outputText.value = '';
  updateStatus('ready', 'Ready');
}

// Insert text into active window
async function insertText() {
  if (!state.text || state.text.trim() === '') {
    showErrorNotification('No text to insert');
    return;
  }

  try {
    updateStatus('processing', 'Inserting...');

    // Small delay to allow window focus
    await new Promise(resolve => setTimeout(resolve, 100));

    await invoke('insert_text', { text: state.text });

    if (!state.settings.autoInsert) {
      clearText();
    }

    updateStatus('ready', 'Inserted!');
    showSuccessNotification('Text inserted successfully');
    setTimeout(() => updateStatus('ready', 'Ready'), 2000);
  } catch (error) {
    console.error('Error inserting text:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    updateStatus('error', 'Insert failed');
    showErrorNotification(`Failed to insert text: ${errorMsg}`);
  }
}

// Toggle panels
function togglePanel(panel: HTMLElement) {
  panel.classList.toggle('visible');
}

// Update settings
function updateSettings() {
  state.settings.autoPunctuation = autoPunctuationInput?.checked ?? true;
  state.settings.numbersAsDigits = numbersAsDigitsInput?.checked ?? false;
  state.settings.autoInsert = autoInsertInput?.checked ?? false;
  state.settings.timeout = parseInt(timeoutInput?.value ?? '5');
  state.settings.modelSize = (modelSizeInput?.value as 'small' | 'large') ?? 'small';

  if (timeoutValue) {
    timeoutValue.textContent = `${state.settings.timeout}s`;
  }

  // Save settings
  localStorage.setItem('voiceDictationSettings', JSON.stringify(state.settings));
}

// Load settings
function loadSettings() {
  const saved = localStorage.getItem('voiceDictationSettings');
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      state.settings = { ...state.settings, ...settings };

      if (autoPunctuationInput) autoPunctuationInput.checked = state.settings.autoPunctuation;
      if (numbersAsDigitsInput) numbersAsDigitsInput.checked = state.settings.numbersAsDigits;
      if (autoInsertInput) autoInsertInput.checked = state.settings.autoInsert;
      if (timeoutInput) timeoutInput.value = String(state.settings.timeout);
      if (modelSizeInput) modelSizeInput.value = state.settings.modelSize;
      if (timeoutValue) timeoutValue.textContent = `${state.settings.timeout}s`;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Don't trigger shortcuts if typing in textarea
  if (e.target === outputText && !e.ctrlKey && !e.metaKey && !e.altKey) {
    return;
  }

  // Ctrl/Cmd + Alt + V: Toggle recording
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'v') {
    e.preventDefault();
    if (!recordButton?.disabled) {
      toggleRecording();
    }
  }

  // Ctrl/Cmd + Alt + C: Copy
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'c') {
    e.preventDefault();
    copyText();
  }

  // Ctrl/Cmd + Alt + I: Insert
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'i') {
    e.preventDefault();
    insertText();
  }

  // Escape: Stop recording if active
  if (e.key === 'Escape' && state.isRecording) {
    e.preventDefault();
    if (!recordButton?.disabled) {
      toggleRecording();
    }
  }
});

// Event listeners
recordButton?.addEventListener('click', toggleRecording);
copyButton?.addEventListener('click', copyText);
clearButton?.addEventListener('click', clearText);
insertButton?.addEventListener('click', insertText);
settingsToggle?.addEventListener('click', () => togglePanel(settingsPanel));
commandsToggle?.addEventListener('click', () => togglePanel(commandsPanel));

// Settings listeners
autoPunctuationInput?.addEventListener('change', updateSettings);
numbersAsDigitsInput?.addEventListener('change', updateSettings);
autoInsertInput?.addEventListener('change', updateSettings);
timeoutInput?.addEventListener('input', updateSettings);
modelSizeInput?.addEventListener('change', updateSettings);

// Touch support for mobile
recordButton?.addEventListener('touchstart', (e) => {
  e.preventDefault();
  toggleRecording();
});

// System initialization check with retry logic
async function initializeSystem(retryCount = 0): Promise<boolean> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second
  
  try {
    updateStatus('processing', 'Checking system...');

    // Ensure invoke is available
    if (typeof invoke !== 'function') {
      throw new Error('Tauri invoke function is not available');
    }

    const status = await invoke<VoiceSystemStatus>('check_voice_system');
    state.systemStatus = status;

    // Validate critical dependencies
    const missingDeps: string[] = [];

    if (!status.nerd_dictation) {
      missingDeps.push('nerd-dictation');
    }
    if (!status.xdotool) {
      missingDeps.push('xdotool');
    }
    if (!status.vosk_model_small && !status.vosk_model_large) {
      missingDeps.push('Vosk models');
    }
    if (!status.microphone) {
      missingDeps.push('microphone');
    }

    if (missingDeps.length > 0) {
      const message = `Missing dependencies: ${missingDeps.join(', ')}. Please install required components.`;
      updateStatus('error', 'Dependencies missing');
      showErrorNotification(message, 10000);
      console.error('System check failed:', status);
      return false;
    }

    // Check model availability for selected size
    if (state.settings.modelSize === 'small' && !status.vosk_model_small) {
      showErrorNotification('Small Vosk model not found. Switching to large model.');
      state.settings.modelSize = 'large';
      if (modelSizeInput) modelSizeInput.value = 'large';
      updateSettings();
    } else if (state.settings.modelSize === 'large' && !status.vosk_model_large) {
      if (status.vosk_model_small) {
        showErrorNotification('Large Vosk model not found. Switching to small model.');
        state.settings.modelSize = 'small';
        if (modelSizeInput) modelSizeInput.value = 'small';
        updateSettings();
      }
    }

    state.isInitialized = true;
    updateStatus('ready', 'Ready');
    console.log('Voice Dictation App Initialized:', status);
    return true;
  } catch (error) {
    console.error('Error checking voice system:', error);
    
    // If it's a Tauri initialization issue and we haven't exceeded max retries, try again
    if (retryCount < maxRetries && (
      error instanceof Error && error.message.includes('invoke') ||
      error instanceof Error && error.message.includes('__TAURI__')
    )) {
      console.log(`Retrying system initialization (attempt ${retryCount + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return initializeSystem(retryCount + 1);
    }
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    updateStatus('error', 'Initialization failed');
    showErrorNotification(`System initialization failed: ${errorMsg}`, 10000);
    return false;
  }
}

// Validate system dependencies before recording
function validateSystemDependencies(): boolean {
  if (!state.systemStatus) {
    showErrorNotification('System status not available');
    return false;
  }

  const { nerd_dictation, xdotool, microphone } = state.systemStatus;
  const hasModel = state.settings.modelSize === 'small'
    ? state.systemStatus.vosk_model_small
    : state.systemStatus.vosk_model_large;

  if (!nerd_dictation) {
    showErrorNotification('nerd-dictation is not installed');
    return false;
  }

  if (!xdotool) {
    showErrorNotification('xdotool is not installed');
    return false;
  }

  if (!hasModel) {
    showErrorNotification(`Vosk ${state.settings.modelSize} model is not installed`);
    return false;
  }

  if (!microphone) {
    showErrorNotification('No microphone detected');
    return false;
  }

  return true;
}

// Toast notification helpers
function showErrorNotification(message: string, duration = 5000) {
  showNotification(message, 'error', duration);
}

function showSuccessNotification(message: string, duration = 3000) {
  showNotification(message, 'success', duration);
}

function showNotification(message: string, type: 'error' | 'success' | 'info', duration = 3000) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-width: 400px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Initialize - Wait for Tauri to be ready
document.addEventListener('DOMContentLoaded', async () => {
  loadSettings();
  
  // Add a small delay to ensure Tauri is fully loaded
  setTimeout(async () => {
    await initializeSystem();
  }, 100);
});
