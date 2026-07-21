// AutoFill Pro - Crypto utilities for secure storage
(() => {
  'use strict';

  // Simple XOR encryption with derived key from user's session
  // Note: For production, use Web Crypto API with PBKDF2
  
  function getEncryptionKey() {
    // Derive key from browser fingerprint + extension ID
    const fingerprint = navigator.userAgent + screen.width + screen.height + new Date().getTimezoneOffset();
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(4);
  }

  function xorEncrypt(data, key) {
    const str = JSON.stringify(data);
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  function xorDecrypt(encrypted, key) {
    try {
      const str = atob(encrypted);
      let result = '';
      for (let i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  // Public API
  window.SecureStorage = {
    async set(key, value) {
      const k = getEncryptionKey();
      const encrypted = xorEncrypt(value, k);
      return new Promise(resolve => {
        chrome.storage.local.set({ [key]: encrypted }, resolve);
      });
    },

    async get(key) {
      const k = getEncryptionKey();
      return new Promise(resolve => {
        chrome.storage.local.get([key], (result) => {
          if (result[key]) {
            resolve(xorDecrypt(result[key], k));
          } else {
            resolve(null);
          }
        });
      });
    },

    async remove(key) {
      return new Promise(resolve => {
        chrome.storage.local.remove([key], resolve);
      });
    }
  };
})();
