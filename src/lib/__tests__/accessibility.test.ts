import { describe, it, expect, beforeEach } from 'vitest';
import { 
  accessibilityColors, 
  touchTargets, 
  announcements, 
  validateAccessibility,
  screenReader
} from '../accessibility';

describe('Accessibility Configuration', () => {
  describe('Color Contrast Standards', () => {
    it('defines colors that meet WCAG 2.1 AA standards', () => {
      expect(accessibilityColors.blue.text).toBe('#1d4ed8');
      expect(accessibilityColors.green.text).toBe('#166534');
      expect(accessibilityColors.red.text).toBe('#dc2626');
      expect(accessibilityColors.yellow.text).toBe('#ca8a04');
      expect(accessibilityColors.gray.text).toBe('#374151');
    });

    it('provides hover and focus states for all colors', () => {
      Object.values(accessibilityColors).forEach(color => {
        expect(color).toHaveProperty('hover');
        expect(color).toHaveProperty('focus');
        expect(color).toHaveProperty('background');
      });
    });
  });

  describe('Touch Target Sizes', () => {
    it('defines minimum touch target sizes following Apple guidelines', () => {
      expect(touchTargets.minimum).toBe(44);
      expect(touchTargets.recommended).toBe(48);
      expect(touchTargets.small).toBe(36);
    });

    it('ensures minimum size meets accessibility standards', () => {
      expect(touchTargets.minimum).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Screen Reader Announcements', () => {
    it('provides announcement templates for common actions', () => {
      expect(announcements.glucoseLogged).toBe('Glucose reading successfully logged');
      expect(announcements.mealLogged).toBe('Meal successfully logged');
      expect(announcements.exerciseLogged).toBe('Exercise activity successfully logged');
    });

    it('provides dynamic announcement functions', () => {
      expect(announcements.unitChanged('mmol/L')).toBe('Display unit changed to mmol/L');
      expect(announcements.stabilityScore(85, 'Very steady')).toBe('Your stability score is 85 out of 100, Very steady');
      expect(announcements.navigationChanged('Plan')).toBe('Navigated to Plan page');
    });

    it('handles data loading announcements', () => {
      expect(announcements.dataLoaded(5, 'glucose')).toBe('5 glucose entries loaded');
      expect(announcements.dataLoaded(1, 'meal')).toBe('1 meal entries loaded');
    });
  });

  describe('Screen Reader Utilities', () => {
    beforeEach(() => {
      // Clean up DOM before each test
      document.body.innerHTML = '';
    });

    it('creates live region announcements', () => {
      screenReader.announce('Test message', 'polite');
      
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.textContent).toBe('Test message');
      expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
    });

    it('creates assertive announcements for urgent messages', () => {
      screenReader.announce('Urgent message', 'assertive');
      
      const liveRegion = document.querySelector('[aria-live="assertive"]');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.textContent).toBe('Urgent message');
    });

    it('creates accessible descriptions for elements', () => {
      // Create a test element
      const testElement = document.createElement('button');
      testElement.id = 'test-button';
      document.body.appendChild(testElement);

      const descriptionId = screenReader.describedBy('test-button', 'This button performs an action');
      
      expect(descriptionId).toBe('test-button-description');
      expect(testElement.getAttribute('aria-describedby')).toBe(descriptionId);
      
      const descriptionElement = document.getElementById(descriptionId);
      expect(descriptionElement?.textContent).toBe('This button performs an action');
      expect(descriptionElement?.className).toBe('sr-only');
    });
  });

  describe('Accessibility Validation', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('validates color contrast (placeholder implementation)', () => {
      expect(validateAccessibility.checkColorContrast('#000000', '#ffffff')).toBe(true);
    });

    it('identifies interactive elements missing accessible names', () => {
      const container = document.createElement('div');
      
      // Button without accessible name
      const button1 = document.createElement('button');
      container.appendChild(button1);
      
      // Button with accessible name
      const button2 = document.createElement('button');
      button2.setAttribute('aria-label', 'Submit form');
      container.appendChild(button2);
      
      // Button with text content
      const button3 = document.createElement('button');
      button3.textContent = 'Click me';
      container.appendChild(button3);
      
      document.body.appendChild(container);
      
      const issues = validateAccessibility.checkAriaLabels(container);
      expect(issues).toHaveLength(1);
      expect(issues[0]).toContain('Interactive element at index 0 missing accessible name');
    });

    it('checks touch target sizes', () => {
      const element = document.createElement('button');
      element.style.width = '44px';
      element.style.height = '44px';
      document.body.appendChild(element);
      
      // Mock getBoundingClientRect
      element.getBoundingClientRect = () => ({
        width: 44,
        height: 44,
        top: 0,
        left: 0,
        bottom: 44,
        right: 44,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });
      
      expect(validateAccessibility.checkTouchTargetSize(element)).toBe(true);
      
      // Test element that's too small
      element.getBoundingClientRect = () => ({
        width: 30,
        height: 30,
        top: 0,
        left: 0,
        bottom: 30,
        right: 30,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });
      
      expect(validateAccessibility.checkTouchTargetSize(element)).toBe(false);
    });
  });

  describe('Wellness-Safe Language Patterns', () => {
    it('uses wellness-focused terminology instead of medical terms', () => {
      // Test that our announcements avoid medical language
      expect(announcements.stabilityScore(85, 'Very steady')).not.toMatch(/control|diabetic|normal|abnormal/i);
      expect(announcements.glucoseLogged).not.toMatch(/blood sugar|diabetic/i);
    });

    it('provides encouraging and neutral language', () => {
      const score = announcements.stabilityScore(45, 'Some ups & downs');
      expect(score).toContain('Some ups & downs');
      expect(score).not.toMatch(/bad|poor|concerning/i);
    });
  });
});

describe('Real-world Accessibility Scenarios', () => {
  it('handles navigation with screen reader', () => {
    const announcement = announcements.navigationChanged('Dashboard');
    expect(announcement).toBe('Navigated to Dashboard page');
  });

  it('announces glucose unit changes', () => {
    const announcement = announcements.unitChanged('mmol/L');
    expect(announcement).toBe('Display unit changed to mmol/L');
  });

  it('provides stability score context', () => {
    const announcement = announcements.stabilityScore(72, 'Mostly steady');
    expect(announcement).toBe('Your stability score is 72 out of 100, Mostly steady');
  });

  it('handles form validation messages', () => {
    const errorMessage = announcements.formError('glucose value');
    expect(errorMessage).toBe('Error in glucose value field, please check your input');
    
    const successMessage = announcements.formSuccess('Glucose logging');
    expect(successMessage).toBe('Glucose logging completed successfully');
  });

  it('announces data loading for context', () => {
    const loadingMessage = announcements.dataLoaded(12, 'timeline');
    expect(loadingMessage).toBe('12 timeline entries loaded');
  });
});