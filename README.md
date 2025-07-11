# MTG Card Search for FlowLauncher

a plugin for fetching info about cards via the [Scryfall](https://scryfall.com/) [API](https://scryfall.com/docs/syntax).

## Usage

1. Type `mtg` followed by your search query
2. Use any of Scryfall's search syntax:
    - `Lightning Bolt` - Search by card name
    - `c:red cmc:1` - Red cards with converted mana cost 1
    - `type:creature power>=4` - Creatures with power 4 or greater
    - `set:dom rare` - Rare cards from Dominaria

## Meta Commands

| Keyword         | Explanation                               |
| --------------- | ----------------------------------------- |
| `:help` or `:?` | Show help and search examples.            |
| `:cache`        | Open or delete the image cache directory. |

## Installation

1. Copy the plugin folder to your FlowLauncher plugins directory
2. Restart FlowLauncher

## Requirements

-   [FlowLauncher](https://github.com/Flow-Launcher/Flow.Launcher)
-   [Node.js](https://github.com/nodejs/node) 14.0.0 or higher

> Note: inline image previews in FlowLauncher are very low res [by design](https://github.com/Flow-Launcher/Flow.Launcher/issues/2030), Quicklook allows you to view in native res. The tradeoff is the previews open behind flow launcher (or infront of if you enable 'always on top' in the QL settings file).

## Credits

-   [MTG Workflow](https://github.com/vitorgalvao/mtg-card-search-workflow/) for [Alfred](https://alfred.app/) (macOS)
-   reddit user [u/cascadeavatar](https://www.reddit.com/r/magicTCG/comments/duklyf/pixel_mtg_card_back_medium_of_choice_gimp2/), from whom I <s>stole</s> sourced the [icon](img/app.png).
