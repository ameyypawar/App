import {fireEvent, render, screen} from '@testing-library/react-native';

import BaseSelectionList from '@components/SelectionList/BaseSelectionList';
import SelectableListItem from '@components/SelectionList/ListItem/SelectableListItem';
import type {ListItem} from '@components/SelectionList/types';

import useKeyboardShortcut from '@hooks/useKeyboardShortcut';

import CONST from '@src/CONST';

import type * as ReactNavigation from '@react-navigation/native';

import React from 'react';

jest.mock('@hooks/useKeyboardShortcut');

jest.mock('@react-navigation/native', () => {
    const actualNavigation: typeof ReactNavigation = jest.requireActual('@react-navigation/native');

    return {
        ...actualNavigation,
        useIsFocused: () => true,
        useFocusEffect: jest.fn(),
    };
});

jest.mock('@hooks/useLocalize', () =>
    jest.fn(() => ({
        translate: (key: string) => key,
        localeCompare: (a: string, b: string) => a.localeCompare(b),
    })),
);

const mockUseKeyboardShortcut = jest.mocked(useKeyboardShortcut);

const data: ListItem[] = [
    {keyForList: 'user-a', text: 'User A'},
    {keyForList: 'user-b', text: 'User B'},
];

/** The plain-Enter shortcut swallows Enter whenever it is active, so its latest registration tells us whether Enter would reach the footer confirm button. */
function getLatestEnterConfig(shortcut = CONST.KEYBOARD_SHORTCUTS.ENTER) {
    const calls = mockUseKeyboardShortcut.mock.calls.filter((registered) => registered[0] === shortcut);
    return calls.at(-1)?.[2];
}

function renderList(extraProps: Partial<React.ComponentProps<typeof BaseSelectionList<ListItem>>> = {}) {
    return render(
        <BaseSelectionList
            data={data}
            ListItem={SelectableListItem}
            onSelectRow={jest.fn()}
            canSelectMultiple
            textInputOptions={{label: 'Search', value: '', onChangeText: jest.fn()}}
            shouldUpdateFocusedIndex
            shouldPreventDefaultFocusOnSelectRow
            confirmButtonOptions={{onConfirm: jest.fn(), isDisabled: false}}
            {...extraProps}
        />,
    );
}

describe('BaseSelectionList focused index on row press', () => {
    beforeEach(() => {
        mockUseKeyboardShortcut.mockClear();
    });

    it('clears the keyboard cursor when a press happens on a searchable multi-select list that refocuses its input', () => {
        renderList();

        fireEvent.press(screen.getByTestId(`${CONST.BASE_LIST_ITEM_TEST_ID}user-a`));

        // With no focused row the plain-Enter shortcut is inactive, so the event bubbles to the footer's pressOnEnter confirm button.
        expect(getLatestEnterConfig()?.isActive).toBe(false);
    });

    it('keeps the pressed row pinned on single-select lists', () => {
        renderList({canSelectMultiple: false});

        fireEvent.press(screen.getByTestId(`${CONST.BASE_LIST_ITEM_TEST_ID}user-a`));

        expect(getLatestEnterConfig()?.isActive).toBe(true);
    });

    it('keeps the pressed row pinned when the list does not refocus its search input', () => {
        renderList({shouldPreventDefaultFocusOnSelectRow: false});

        fireEvent.press(screen.getByTestId(`${CONST.BASE_LIST_ITEM_TEST_ID}user-a`));

        expect(getLatestEnterConfig()?.isActive).toBe(true);
    });
});
