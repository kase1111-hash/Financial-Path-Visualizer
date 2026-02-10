/**
 * Profile Editor View
 *
 * Full-featured editor for financial profiles.
 */

import type { FinancialProfile } from '@models/profile';
import type { FilingStatus } from '@models/assumptions';
import { createElement } from '@ui/utils/dom';
import { createButton } from '@ui/components/Button';
import {
  createTextInput,
  createNumberInput,
  createStateSelect,
  createFilingStatusSelect,
} from '@ui/components/form';
import { createIncomeEditor } from './IncomeEditor';
import { createDebtEditor } from './DebtEditor';
import { createAssetEditor } from './AssetEditor';
import { navigate, markDirty, markClean, setLoading, setError } from '@ui/utils/state';
import { saveProfile } from '@storage/profile-store';

export interface ProfileEditorOptions {
  profile: FinancialProfile;
  onSave?: (profile: FinancialProfile) => void;
}

export interface ProfileEditorComponent {
  element: HTMLElement;
  getProfile(): FinancialProfile;
  save(): Promise<void>;
  destroy(): void;
}

export function createProfileEditor(options: ProfileEditorOptions): ProfileEditorComponent {
  const { onSave } = options;
  const profile = { ...options.profile, assumptions: { ...options.profile.assumptions } };

  const container = createElement('div', { class: 'profile-editor' });
  const components: { destroy(): void }[] = [];

  // Header
  const header = createElement('header', { class: 'profile-editor__header' });

  const headerLeft = createElement('div', { class: 'profile-editor__header-left' });
  const backButton = createButton({
    text: '← Back',
    variant: 'ghost',
    size: 'small',
    onClick: () => { navigate('trajectory'); },
  });
  components.push(backButton);
  headerLeft.appendChild(backButton.element);

  const title = createElement('h1', { class: 'profile-editor__title' }, ['Edit Profile']);
  headerLeft.appendChild(title);
  header.appendChild(headerLeft);

  const headerActions = createElement('div', { class: 'profile-editor__actions' });

  const saveButton = createButton({
    text: 'Save Changes',
    variant: 'primary',
    onClick: () => { void save(); },
  });
  components.push(saveButton);
  headerActions.appendChild(saveButton.element);

  const viewButton = createButton({
    text: 'View Projection',
    variant: 'secondary',
    onClick: () => { navigate('trajectory'); },
  });
  components.push(viewButton);
  headerActions.appendChild(viewButton.element);

  header.appendChild(headerActions);
  container.appendChild(header);

  // Main content
  const content = createElement('div', { class: 'profile-editor__content' });

  // Basic Info Section
  const basicSection = createElement('section', { class: 'profile-editor__section' });
  basicSection.appendChild(
    createElement('h2', { class: 'profile-editor__section-title' }, ['Basic Information'])
  );

  const basicGrid = createElement('div', { class: 'profile-editor__grid' });

  // Profile Name
  const nameInput = createTextInput({
    id: 'profile-name',
    label: 'Profile Name',
    value: profile.name,
    required: true,
    onChange: (value) => {
      profile.name = value;
      markDirty();
    },
  });
  components.push(nameInput);
  basicGrid.appendChild(nameInput.element);

  // Age (from assumptions)
  const ageInput = createNumberInput({
    id: 'profile-age',
    label: 'Current Age',
    value: profile.assumptions.currentAge,
    min: 18,
    max: 100,
    onChange: (value) => {
      if (value !== null) {
        profile.assumptions = { ...profile.assumptions, currentAge: value };
        markDirty();
      }
    },
  });
  components.push(ageInput);
  basicGrid.appendChild(ageInput.element);

  // State (from assumptions)
  const stateSelect = createStateSelect({
    id: 'profile-state',
    label: 'State',
    value: profile.assumptions.state,
    onChange: (value) => {
      profile.assumptions = { ...profile.assumptions, state: value };
      markDirty();
    },
  });
  components.push(stateSelect);
  basicGrid.appendChild(stateSelect.element);

  // Filing Status (from assumptions)
  const filingSelect = createFilingStatusSelect({
    id: 'profile-filing',
    label: 'Tax Filing Status',
    value: profile.assumptions.taxFilingStatus,
    onChange: (value) => {
      profile.assumptions = { ...profile.assumptions, taxFilingStatus: value as FilingStatus };
      markDirty();
    },
  });
  components.push(filingSelect);
  basicGrid.appendChild(filingSelect.element);

  basicSection.appendChild(basicGrid);
  content.appendChild(basicSection);

  // Income Section
  const incomeEditor = createIncomeEditor({
    profile,
    onChange: (income) => {
      profile.income = income;
      markDirty();
    },
  });
  components.push(incomeEditor);
  content.appendChild(incomeEditor.element);

  // Assets Section
  const assetEditor = createAssetEditor({
    profile,
    onChange: (assets) => {
      profile.assets = assets;
      markDirty();
    },
  });
  components.push(assetEditor);
  content.appendChild(assetEditor.element);

  // Debt Section
  const debtEditor = createDebtEditor({
    profile,
    onChange: (debts) => {
      profile.debts = debts;
      markDirty();
    },
  });
  components.push(debtEditor);
  content.appendChild(debtEditor.element);

  container.appendChild(content);

  async function save(): Promise<void> {
    saveButton.setLoading(true);
    setLoading(true);

    try {
      profile.updatedAt = new Date();
      await saveProfile(profile);
      markClean();
      onSave?.(profile);
      setLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save profile');
      saveButton.setLoading(false);
    }
  }

  return {
    element: container,

    getProfile(): FinancialProfile {
      return profile;
    },

    async save(): Promise<void> {
      return save();
    },

    destroy(): void {
      for (const component of components) {
        component.destroy();
      }
    },
  };
}
