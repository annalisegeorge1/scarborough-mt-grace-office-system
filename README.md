# Scarborough / Mt. Grace District Office Service System — V270

**Current status: feature freeze / UAT defect-fix staging candidate**

V270 is a feature-freeze maintenance release. It fixes a public tablet/mobile usability defect identified during visual UAT.

No major feature was added.

## Civic Flow defect

The shared Civic Flow component used on focused public routes such as:

- Community
- Forms
- Updates

was visually presenting a four-stage resident flow, but on tablet/mobile the cards could appear frozen on **Stage 1 of 4**.

The underlying cause was that the flow state primarily followed vertical page-section observers while the cards themselves became a horizontal swipe rail on smaller screens.

That meant:
- horizontal card movement and the stage label were not reliably synchronized;
- active cards were not automatically brought into view when page progress changed;
- section targets inserted later by other public-page scripts could be missed at initialization.

## V270 repair

The shared `district-civic-flow-v237.js` logic now:

- synchronizes the active stage when the horizontal card rail is swiped;
- automatically scrolls the active card into view as the resident moves through the page;
- dynamically re-resolves page targets instead of depending only on targets present at initial load;
- resynchronizes after public-page DOM changes;
- supports current URL hash state;
- keeps the homepage's non-stage wording intact.

## Tablet/mobile controls

The shared flow header now also includes:

- previous-stage button
- next-stage button

on tablet/mobile.

Residents can therefore move the staged cards by:
- swiping the card rail;
- tapping previous/next;
- scrolling through the corresponding page sections;
- tapping a flow card to jump to its destination.

The active card receives a stronger visual state.

## Accessibility / reduced motion

Reduced-motion preferences remain respected.

The navigation buttons expose accessible labels and disable correctly at the first/last stage.

## Feature-freeze rule

This release is permitted under the V269 freeze because it repairs a responsive/UAT defect rather than expanding system scope.

The feature-freeze rules and structured UAT plan remain in effect.

## Verification

Source validation confirms the Civic Flow JavaScript parses.

The staging smoke suite now explicitly checks:
- `/assets/district-civic-flow-v237.js`
- `/assets/district-civic-flow-v237.css`

in addition to the existing public page smoke checks.

## Backend release identity

The server package version is now `270.0.0`.

## Production boundary

V270 is a public-interface defect fix. It does not alter resident data, staff permissions, publishing authority, production authorization or the V269 feature-freeze discipline.
