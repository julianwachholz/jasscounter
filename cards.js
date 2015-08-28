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

var Card = function(color, value) {
    if (!(this instanceof Card)) {
        return new Card(color, value);
    }
    this.color = color;
    this.value = value;
};
Card.prototype.toString = function(trump) {
    var str = COLORS[this.color] + ' ' + VALUES[this.value];
    if (this.color === trump && (this.value === 3 || this.value === 5)) {
        str = '*' + str + '*';
    }
    return str;
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

} (this, this.document, void 0));
