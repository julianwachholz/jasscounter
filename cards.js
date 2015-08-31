(function(window, document, undefined) {
'use strict';

var COLORS = [
    'Schellen',
    'Rosen',
    'Schilten',
    'Eichel'
];
var VALUES = [
    '6',
    '7',
    '8',
    '9',
    '10',
    'Under',
    'Ober',
    'König',
    'As'
];
var TRUMP_VALUES = [
    '6',
    '7',
    '8',
    '10',
    'Ober',
    'König',
    'As',
    '9',
    'Under'
];

var VALUE_CLASSES = [
    'c6',
    'c7',
    'c8',
    'c9',
    'c10',
    'under',
    'ober',
    'koenig',
    'as'
];

var Card = function(color, value) {
    if (!(this instanceof Card)) {
        return new Card(color, value);
    }
    this.color = color;
    this.value = value;
};
Card.prototype.toString = function(trump) {
    return COLORS[this.color] + ' ' + VALUES[this.value];
};
Card.prototype.getNode = function(trump, extraClass) {
    var node = document.createElement('button');
    node.innerHTML = this.toString(trump);
    node.classList.add(
        'card',
        COLORS[this.color].toLowerCase(),
        VALUE_CLASSES[this.value]);
    if (extraClass) {
        node.classList.add(extraClass);
    }
    return node;
};
Card.prototype.getPoints = function(trump) {
    if (this.color === trump) {
        if (this.value === 3) {
            return 14;
        }
        if (this.value === 5) {
            return 20;
        }
    }
    switch (this.value) {
        case 4: return 10;
        case 5: return 2;
        case 6: return 3;
        case 7: return 4;
        case 8: return 11;
        default: return 0;
    }
};
Card.prototype.isHigherThan = function(card, trickColor, trump) {
    if (this.color === trump) {
        if (card.color !== trump) {
            return true;
        }
        return TRUMP_VALUES.indexOf(VALUES[this.value])
               > TRUMP_VALUES.indexOf(VALUES[card.value]);
    }
    if (card.color === trump) {
        return false;
    }
    if (this.color === trickColor) {
        if (card.color !== trickColor) {
            return true;
        }
        return this.value > card.value;
    }
    return false;
};
Card.prototype.isEqual = function(card) {
    return this.color === card.color &&
        this.value === card.value;
};

var CARDS = (function() {
    var color, value, cards = [];
    for (color = 0; color < COLORS.length; color += 1) {
        for (value = 0; value < VALUES.length; value += 1) {
            cards.push(new Card(color, value));
        }
    }
    return cards;
}());

window.CARDS = CARDS;
window.COLORS = COLORS;
window.VALUES = VALUES;

} (this, this.document, void 0));
