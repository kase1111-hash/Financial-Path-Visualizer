/**
 * Asset Editor Section
 *
 * Edit assets in the profile.
 */

import type { Asset, AssetType } from '@models/asset';
import type { FinancialProfile } from '@models/profile';
import { createAsset } from '@models/asset';
import { generateId } from '@models/common';
import { createElement, clearChildren } from '@ui/utils/dom';
import { formatCurrency, formatPercent } from '@ui/utils/format';
import { createEditorSection } from '@ui/components/EditorSection';
import { createItemCard } from '@ui/components/ItemCard';
import { createModal } from '@ui/components/Modal';
import {
  createTextInput,
  createCurrencyInput,
  createPercentageInput,
  createSelect,
} from '@ui/components/form';

export interface AssetEditorOptions {
  profile: FinancialProfile;
  onChange: (assets: Asset[]) => void;
}

export interface AssetEditorComponent {
  element: HTMLElement;
  update(profile: FinancialProfile): void;
  destroy(): void;
}

export function createAssetEditor(options: AssetEditorOptions): AssetEditorComponent {
  const { onChange } = options;
  let profile = options.profile;

  const components: { destroy(): void }[] = [];

  const section = createEditorSection({
    title: 'Assets & Savings',
    id: 'assets',
    addButtonLabel: 'Add Asset',
    onAdd: () => { showAssetModal(); },
    emptyMessage: 'No assets added. Add your retirement accounts, savings, and investments.',
  });
  components.push(section);

  function renderAssets(): void {
    clearChildren(section.content);

    const isEmpty = profile.assets.length === 0;
    section.setEmpty(isEmpty);
    section.setCount(profile.assets.length);

    if (isEmpty) {
      const emptyEl = createElement('div', { class: 'editor-section__empty' }, [
        'No assets added. Add your retirement accounts, savings, and investments.',
      ]);
      section.content.appendChild(emptyEl);
      return;
    }

    const totalAssets = profile.assets.reduce((sum: number, a: Asset) => sum + a.balance, 0);

    const summaryEl = createElement('div', { class: 'editor-section__summary' }, [
      `Total Assets: ${formatCurrency(totalAssets, { compact: true })}`,
    ]);
    section.content.appendChild(summaryEl);

    for (const asset of profile.assets) {
      const card = createAssetCard(asset);
      components.push(card);
      section.content.appendChild(card.element);
    }
  }

  function createAssetCard(asset: Asset): ReturnType<typeof createItemCard> {
    const typeLabels: Record<AssetType, string> = {
      retirement_pretax: '401(k)/Traditional IRA',
      retirement_roth: 'Roth 401(k)/Roth IRA',
      savings: 'Savings Account',
      investment: 'Brokerage',
      property: 'Property',
      hsa: 'HSA',
      other: 'Other',
    };

    const details: { label: string; value: string }[] = [
      { label: 'Type', value: typeLabels[asset.type] },
      { label: 'Expected Return', value: formatPercent(asset.expectedReturn) },
    ];

    if (asset.monthlyContribution > 0) {
      details.push({
        label: 'Monthly Contribution',
        value: formatCurrency(asset.monthlyContribution),
      });
    }

    if (asset.employerMatch !== null) {
      details.push({ label: 'Employer Match', value: formatPercent(asset.employerMatch) });
    }

    return createItemCard({
      title: asset.name,
      primaryValue: formatCurrency(asset.balance, { compact: true }),
      subtitle: `${formatPercent(asset.expectedReturn)} expected return`,
      details,
      onEdit: () => { showAssetModal(asset); },
      onDelete: () => { deleteAsset(asset.id); },
    });
  }

  function showAssetModal(existingAsset?: Asset): void {
    const isEditing = !!existingAsset;

    const formContainer = createElement('form', { class: 'modal-form' });
    const formComponents: { destroy(): void }[] = [];

    const nameInput = createTextInput({
      id: 'asset-name',
      label: 'Name',
      value: existingAsset?.name ?? '',
      required: true,
      placeholder: 'e.g., 401(k)',
    });
    formComponents.push(nameInput);
    formContainer.appendChild(nameInput.element);

    const typeSelect = createSelect<AssetType>({
      id: 'asset-type',
      label: 'Type',
      value: existingAsset?.type ?? 'savings',
      options: [
        { value: 'retirement_pretax', label: '401(k)/Traditional IRA' },
        { value: 'retirement_roth', label: 'Roth 401(k)/Roth IRA' },
        { value: 'savings', label: 'Savings Account' },
        { value: 'investment', label: 'Brokerage Account' },
        { value: 'hsa', label: 'HSA' },
        { value: 'property', label: 'Property' },
        { value: 'other', label: 'Other' },
      ],
    });
    formComponents.push(typeSelect);
    formContainer.appendChild(typeSelect.element);

    const balanceInput = createCurrencyInput({
      id: 'asset-balance',
      label: 'Current Balance',
      value: existingAsset?.balance,
      required: true,
      min: 0,
    });
    formComponents.push(balanceInput);
    formContainer.appendChild(balanceInput.element);

    const returnInput = createPercentageInput({
      id: 'asset-return',
      label: 'Expected Annual Return',
      value: existingAsset?.expectedReturn ?? 0.07,
      min: -0.5,
      max: 0.5,
    });
    formComponents.push(returnInput);
    formContainer.appendChild(returnInput.element);

    const contributionInput = createCurrencyInput({
      id: 'asset-contribution',
      label: 'Monthly Contribution',
      value: existingAsset?.monthlyContribution ?? 0,
      min: 0,
    });
    formComponents.push(contributionInput);
    formContainer.appendChild(contributionInput.element);

    const employerMatchInput = createPercentageInput({
      id: 'asset-employer-match',
      label: 'Employer Match Rate (optional)',
      value: existingAsset?.employerMatch ?? undefined,
      min: 0,
      max: 2,
      helpText: 'e.g., 0.5 = 50% match',
    });
    formComponents.push(employerMatchInput);
    formContainer.appendChild(employerMatchInput.element);

    const matchLimitInput = createPercentageInput({
      id: 'asset-match-limit',
      label: 'Match Limit (optional)',
      value: existingAsset?.matchLimit ?? undefined,
      min: 0,
      max: 1,
      helpText: 'Max salary % employer matches',
    });
    formComponents.push(matchLimitInput);
    formContainer.appendChild(matchLimitInput.element);

    const modal = createModal({
      title: isEditing ? 'Edit Asset' : 'Add Asset',
      content: formContainer,
      size: 'large',
      primaryAction: isEditing ? 'Save Changes' : 'Add Asset',
      secondaryAction: 'Cancel',
      onPrimary: () => {
        const newAsset = createAsset({
          id: existingAsset?.id ?? generateId(),
          name: nameInput.getValue() || 'Asset',
          type: typeSelect.getValue() ?? 'savings',
          balance: balanceInput.getValue() ?? 0,
          expectedReturn: returnInput.getValue() ?? 0.07,
          monthlyContribution: contributionInput.getValue() ?? 0,
          employerMatch: employerMatchInput.getValue() ?? null,
          matchLimit: matchLimitInput.getValue() ?? null,
        });

        if (isEditing) {
          const index = profile.assets.findIndex((a: Asset) => a.id === existingAsset.id);
          if (index >= 0) {
            profile.assets[index] = newAsset;
          }
        } else {
          profile.assets.push(newAsset);
        }

        onChange([...profile.assets]);
        renderAssets();
      },
      onClose: () => {
        for (const c of formComponents) {
          c.destroy();
        }
      },
    });

    modal.show();
  }

  function deleteAsset(id: string): void {
    profile.assets = profile.assets.filter((a: Asset) => a.id !== id);
    onChange([...profile.assets]);
    renderAssets();
  }

  renderAssets();

  return {
    element: section.element,

    update(newProfile: FinancialProfile): void {
      profile = newProfile;
      renderAssets();
    },

    destroy(): void {
      for (const component of components) {
        component.destroy();
      }
    },
  };
}
