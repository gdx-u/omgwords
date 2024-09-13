// Get gamevars
let players = 2;
let clabbers = confirm("Clabbers?")
let handicap = {
    points: Number(prompt("Points handicap?")) || 0,
    clabbers: !clabbers && confirm("Clabbers handicap?")
};

let dict = [];
let sd = [];
async function load_dictionary() {
    let file = await fetch("dict.txt");
    let text = await file.text();
    dict = text.split("\r\n");
    sd = text.split("\r\n").map(e => [...e].sort().join(""));
    sd = [...new Set(sd)];
}

function is_valid(word) {
    if (clabbers || (player == 1 && handicap.clabbers)) {
        let sorted = [...word].sort().join("");
        return sd.includes(sorted);
    } else return dict.includes(word);
}

load_dictionary();

let lacked_parallel = false;
let lacked_added_parallel = false;
let csc_zero = 0;
let turn = 0;
let squares = [];
let squaresHM = {};
let holder = document.querySelector(".squares");

let bw = 15;
let point_values = {
    "A": 1,
    "B": 3,
    "C": 3,
    "D": 2,
    "E": 1,
    "F": 4,
    "G": 2,
    "H": 4,
    "I": 1,
    "J": 8,
    "K": 5,
    "L": 1,
    "M": 3,
    "N": 1,
    "O": 1,
    "P": 3,
    "Q": 10,
    "R": 1,
    "S": 1,
    "T": 1,
    "U": 1,
    "V": 4,
    "W": 4,
    "X": 8,
    "Y": 4,
    "Z": 10
};

function conv_bs(s) {
    ns = "";
    for (let c of s) ns += conv.includes(c) ? from[conv.indexOf(c)] : c;
    return ns;
}

let from = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
let conv = "!@£$%^&*()-=_+[]{};':#~/?.∫<,\\|`¬¦™£€∞§¶•ªº≠“‘∆∑´®†¥";
for (let char of conv) point_values[char] = 0;

function get_key(obj, value) {
    for (let key of Object.keys(obj)) {
        if (obj[key] == value) return key;
    }

    return null;
}

function crosses_middle_square() {
    for (let el of Object.values(placed)) {
        if (el.id == "8 8") return true;
    }

    return false;
}

function create_square(x, y) {
    let div = document.createElement("div");
    div.className = "square empty";
    div.id = `${x} ${y}`;
    squaresHM[`${x} ${y}`] = {
        el: div,
        tile_bonus: 1,
        word_bonus: 1,
        is_starting_tile: false,
        is_blank: false
    };
    div.style.top = `${y * 32}px`;
    div.style.left = `${x * 32}px`;
    squares.push(div);
    holder.appendChild(div);
    return div;
}

function generate_board() {
    let layout="T  d   T   d  T* D   t   t   D *  D   d d   D  *d  D   d   D  d*    D     D    * t   t   t   t *  d   d d   d  *T  d   S   d  T";
    let parts = layout.split("*");
    for (let i = parts.length - 2; i >= 0; i--) {
        parts.push(parts[i]);
    }

    layout = parts.join("");
    let x = 1;
    let y = 1;
    for (let char of layout) {
        let square = create_square(x, y);
        if (char == " ") {
            // praise the lord
        } else {
            switch (char) {
                case "S":
                    squaresHM[square.id].is_starting_tile = true;
                    squaresHM[square.id].word_bonus = 2;
                    square.style.background = "red";
                    break;
                case "d":
                    squaresHM[square.id].tile_bonus = 2;
                    square.style.background = "cyan";
                    break;
                case "D":
                    squaresHM[square.id].word_bonus = 2;
                    square.style.background = "orange";
                    break;
                case "t":
                    squaresHM[square.id].tile_bonus = 3;
                    square.style.background = "#6260df";
                    break;
                case "T":
                    squaresHM[square.id].word_bonus = 3;
                    square.style.background = "red";
                    break;
            }
        }

        x++;
        if (x > bw) {
            x = 1;
            y++;
        }
    }
}

let cursor;
let cursor_direction;

let placed = {};

let bag = "??AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ".toLowerCase();
let rack = "";
let racks = ["", "", ""];
for (let i = 0; i < 14; i++) {
    let j = Math.round(Math.random() * (bag.length - 1));
    racks[Math.floor(i / 7) + 1] += bag[j];
    bag = bag.slice(0, j) + bag.slice(j + 1);
}
let typed = "";
let player = 1;
rack = racks[player];
let player_scores = [0, handicap.points, 0];
load_rack();

function olc(w) {
    return [...w].filter(c => c == c.toLowerCase()).join("");
}

function get_parallel() {
    if (cursor_direction) {
        let parallel = get_sliceH(Number(placed[Object.keys(placed)[0]].id.split(" ")[1]));
        let chars = "";
        for (let el of parallel) {
            let char = el.el.innerText.toUpperCase() || " ";
            if (squaresHM[el.el.id].is_blank) char = conv[from.indexOf(char)];
            if (el.el.classList.contains("new")) {
                if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)) {
                    char = char.toLowerCase();
                } else {
                    char = conv[conv.indexOf(char) + 26];
                }
            }
            chars += char || " ";
        }

        chars = chars.replaceAll("↓", " ").replaceAll(">", " ");
        let words = chars.split(" ");
        let corr = [];
        let i = 0;
        for (let word of words) {
            corr.push(parallel.slice(i, i + word.length));
            i += word.length || 1;
        }
        let word = words.filter(e => olc(conv_bs(e)) == typed)[0];
        let idx = words.indexOf(word);
        return [word, corr[idx]];
    } else {
        let parallel = get_sliceV(Number(placed[Object.keys(placed)[0]].id.split(" ")[0]));
        let chars = "";
        for (let el of parallel) {
            let char = el.el.innerText.toUpperCase() || " ";
            if (squaresHM[el.el.id].is_blank) char = conv[from.indexOf(char)];
            if (el.el.classList.contains("new")) {
                if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)) {
                    char = char.toLowerCase();
                } else {
                    char = conv[conv.indexOf(char) + 26];
                }
            }
            chars += char || " ";
        }

        chars = chars.replaceAll("↓", " ").replaceAll(">", " ");
        let words = chars.split(" ");
        let corr = [];
        let i = 0;
        for (let word of words) {
            corr.push(parallel.slice(i, i + word.length));
            i += word.length || 1;
        }
        let word = words.filter(e => olc(conv_bs(e)) == typed)[0];
        let idx = words.indexOf(word);
        return [word, corr[idx]];
    }
}

function check_parallel() {
    if (cursor_direction) {
        let parallel = get_sliceH(Number(placed[Object.keys(placed)[0]].id.split(" ")[1]));
        let chars = "";
        for (let el of parallel) {
            let char = el.el.innerText.toUpperCase() || " ";
            if (squaresHM[el.el.id].is_blank) char = conv[from.indexOf(char)];
            if (el.el.classList.contains("temp")) {
                if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)) {
                    char = char.toLowerCase();
                } else {
                    char = conv[conv.indexOf(char) <= 25 ? conv.indexOf(char) + 26 : conv.indexOf(char)];
                }
            }
            chars += char || " ";
        }

        chars = chars.replaceAll("↓", " ").replaceAll(">", " ");
        let words = chars.split(" ");
        let word = words.filter(e => olc(conv_bs(e)) == typed)[0];
        if (word.length == 1) {
            cursor_direction = 1 - cursor_direction;
            lacked_parallel = true;
            lacked_added_parallel = true;
        } else {
            lacked_parallel = false;
            if (conv_bs(word).toLowerCase() == typed) lacked_added_parallel = true;
            else lacked_added_parallel = false;
        }
        return word.length == 1 || is_valid(conv_bs(word).toUpperCase());
    } else {
        let parallel = get_sliceV(Number(placed[Object.keys(placed)[0]].id.split(" ")[0]));
        let chars = "";
        for (let el of parallel) {
            let char = el.el.innerText.toUpperCase() || " ";
            if (squaresHM[el.el.id].is_blank) char = conv[from.indexOf(char)];
            if (el.el.classList.contains("temp")) {
                if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)) {
                    char = char.toLowerCase();
                } else {
                    char = conv[conv.indexOf(char) <= 25 ? conv.indexOf(char) + 26 : conv.indexOf(char)];
                }
            }
            chars += char || " ";
        }

        chars = chars.replaceAll("↓", " ").replaceAll(">", " ");
        let words = chars.split(" ");
        let word = words.filter(e => olc(conv_bs(e)) == typed)[0];
        if (word.length == 1) {
            cursor_direction = 1 - cursor_direction;
            lacked_parallel = true;
            lacked_added_parallel = true;
        } else {
            lacked_parallel = false;
            if (conv_bs(word).toLowerCase() == typed) lacked_added_parallel = true;
            else lacked_added_parallel = false;
        }

        return word.length == 1 || is_valid(conv_bs(word).toUpperCase());
    }
}

function check_perpendicular() {
    let added_perp = false;
    if (cursor_direction) {
        for (let el of Object.values(placed)) {
            let perpendicular = get_sliceV(Number(el.id.split(" ")[0]));
            let c = squaresHM[el.id].is_blank ? conv[from.indexOf(get_key(placed, el).replaceAll("*", ""))] : get_key(placed, el).replaceAll("*", "");

            let chars = "";
            for (let el of perpendicular) {
                let char = el.el.innerText.toUpperCase() || " ";
                if (squaresHM[el.el.id].is_blank) char = conv[from.indexOf(char)];
                if (el.el.classList.contains("temp")) {
                    if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)) {
                        char = char.toLowerCase();
                    } else {
                        char = conv[conv.indexOf(char) + 26];
                    }
                }
                chars += char || " ";
            }
    
            chars = chars.replaceAll("↓", " ").replaceAll(">", " ");
            let words = chars.split(" ");
            let word = words.filter(e => e.includes(c))[0]; // There will only ever be one here
            // if (word.length == 1 && lacked_parallel) return false;
            if (word.length > 1) added_perp = true;
            if (word.replace(c, "")) {
                added = [...word].filter(ch => ch == ch.toUpperCase()).join("");
                if (added) {
                    if (!is_valid(conv_bs(word).toUpperCase())) return false;
                }
            }
        }
    } else {
        for (let el of Object.values(placed)) {
            let perpendicular = get_sliceH(Number(el.id.split(" ")[1]));
            let c = squaresHM[el.id].is_blank ? conv[from.indexOf(get_key(placed, el).replaceAll("*", ""))] : get_key(placed, el).replaceAll("*", "");

            let chars = "";
            for (let el of perpendicular) {
                let char = el.el.innerText.toUpperCase() || " ";
                if (squaresHM[el.el.id].is_blank) char = conv[from.indexOf(char)];
                if (el.el.classList.contains("temp")) {
                    if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)) {
                        char = char.toLowerCase();
                    } else {
                        char = conv[conv.indexOf(char) + 26];
                    }
                }
                chars += char || " ";
            }
    
            chars = chars.replaceAll("↓", " ").replaceAll(">", " ");
            let words = chars.split(" ");
            let word = words.filter(e => e.includes(c))[0]; // There will only ever be one here
            // if (word.length == 1 && lacked_parallel) return false;
            if (word.length > 1) added_perp = true;
            if (word.replace(c, "")) {
                added = [...word].filter(ch => ch == ch.toUpperCase()).join("");
                if (added) {
                    if (!is_valid(conv_bs(word).toUpperCase())) return false;
                }
            }
        }
    }

    if (!added_perp && (lacked_parallel || (lacked_added_parallel && turn))) return false;
    if (lacked_added_parallel && !turn && !crosses_middle_square()) return false
    return true;
}

function score_parallel(word_bonus) {
    // TODO: make it work retard
    if (cursor_direction) { // Horizontal
        let added_score = 0;
        let parallel = get_sliceH(Number(placed[Object.keys(placed)[0]].id.split(" ")[1]));
        let chars = "";
        for (let el of parallel) {
            let char = el.el.innerText.toUpperCase() || " ";
            if (squaresHM[el.el.id].is_blank) char = conv[from.indexOf(char)];
            if (el.el.classList.contains("new")) {
                if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)) {
                    char = char.toLowerCase();
                } else {
                    char = conv[conv.indexOf(char) + 26];
                }
            }
            chars += char;
        }

        chars = chars.replaceAll("↓", " ").replaceAll(">", " ");
        let words = chars.split(" ");
        let word = words.filter(e => olc(conv_bs(e)) == typed)[0];
        added = [...word].filter(c => c == c.toUpperCase()).join("");
        for (let char of added) {
            added_score += point_values[char] * word_bonus;
        }

        return added_score;
    } else {
        let added_score = 0;
        let parallel = get_sliceV(Number(placed[Object.keys(placed)[0]].id.split(" ")[0]));
        let chars = "";
        for (let el of parallel) {
            let char = el.el.innerText.toUpperCase() || " ";
            if (squaresHM[el.el.id].is_blank) char = conv[from.indexOf(char)];
            if (el.el.classList.contains("new")) {
                if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)) {
                    char = char.toLowerCase();
                } else {
                    char = conv[conv.indexOf(char) + 26];
                }
            }
            chars += char;
        }

        chars = chars.replaceAll("↓", " ").replaceAll(">", " ");
        let words = chars.split(" ");
        let word = words.filter(e => olc(conv_bs(e)) == typed)[0];
        added = [...word].filter(c => c == c.toUpperCase()).join("");
        for (let char of added) {
            added_score += point_values[char] * word_bonus;
        }

        return added_score;
    }
}

function score_perpendicular() {
    let running = 0;
    if (cursor_direction) {
        for (let el of Object.values(placed)) {
            let wb = squaresHM[el.id].word_bonus;
            let perpendicular = get_sliceV(Number(el.id.split(" ")[0]));
            let c = squaresHM[el.id].is_blank ? conv[from.indexOf(get_key(placed, el).replaceAll("*", ""))] : get_key(placed, el).replaceAll("*", "");

            let chars = "";
            for (let el of perpendicular) {
                let char = el.el.innerText.toUpperCase() || " ";
                if (squaresHM[el.el.id].is_blank) char = conv[from.indexOf(char)];
                if (el.el.classList.contains("new")) {
                    if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)) {
                        char = char.toLowerCase();
                    } else {
                        char = conv[conv.indexOf(char) + 26];
                    }
                }
                chars += char || " ";
            }
    
            chars = chars.replaceAll("↓", " ").replaceAll(">", " ");
            let words = chars.split(" ");
            let word = words.filter(e => e.includes(c))[0]; // There will only ever be one here
            if (word.replace(c, "")) {
                added = [...word].filter(ch => ch == ch.toUpperCase()).join("");
                if (added) {
                    let base = 0;
                    for(let char of added) {
                        base += point_values[char];
                    }
    
                    running += base * wb;
                }
                if (typed.length > 1) running += (squaresHM[el.id].is_blank ? 0 : point_values[c.toUpperCase()]) * wb * squaresHM[el.id].tile_bonus;
            }
        }
        // let perpendicular
        // for (let el of perpendicular) 
    } else {
        for (let el of Object.values(placed)) {
            let wb = squaresHM[el.id].word_bonus;
            let perpendicular = get_sliceH(Number(el.id.split(" ")[1]));
            let c = squaresHM[el.id].is_blank ? conv[from.indexOf(get_key(placed, el).replaceAll("*", ""))] : get_key(placed, el).replaceAll("*", "");

            let chars = "";
            for (let el of perpendicular) {
                let char = el.el.innerText.toUpperCase() || " ";
                if (squaresHM[el.el.id].is_blank) char = conv[from.indexOf(char)];
                if (el.el.classList.contains("new")) {
                    if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(char)) {
                        char = char.toLowerCase();
                    } else {
                        char = conv[conv.indexOf(char) + 26];
                    }
                }
                chars += char || " ";
            }
    
            chars = chars.replaceAll("↓", " ").replaceAll(">", " ");
            let words = chars.split(" ");
            let word = words.filter(e => e.includes(c))[0]; // There will only ever be one here
            if (word.replace(c, "")) {
                added = [...word].filter(ch => ch == ch.toUpperCase()).join("");
                if (added) {
                    let base = 0;
                    for(let char of added) {
                        base += point_values[char];
                    }
    
                    running += base * wb;
                }
                if (typed.length > 1) running += (squaresHM[el.id].is_blank ? 0 : point_values[c.toUpperCase()]) * wb * squaresHM[el.id].tile_bonus;
            }
        }
    }
    return running;
}

document.onmousedown = (e) => {
    if (e.target.classList.contains("empty")) {
        if (cursor && ">↓".includes(cursor.innerText)) {
            cursor.innerText = cursor.innerText.replaceAll(">", "").replaceAll("↓", "");
            for (let char of Object.keys(placed)) {
                rack += squaresHM[placed[char].id].is_blank ? "?" : char.replaceAll("*", "");
                squaresHM[placed[char].id].is_blank = false;
                load_rack();
                placed[char].innerText = "";
                delete placed[char];
            }
            typed = "";
        }
        if (cursor == e.target) {
            if (!cursor_direction) {
                cursor.innerText = '';
                cursor = null;
                cursor_direction = null;
            } else {
                cursor_direction = 0;
                cursor.innerText = "↓";
            }
        } else {
            cursor = e.target;
            cursor_direction = 1;
            cursor.innerText = ">";
        }
    }
}

function redraw_cursor(x, y) {
    if (cursor && ">v".includes(cursor.innerText)) {
        cursor.innerText = cursor.innerText.replaceAll(">", "").replaceAll("↓", "");
    }

    cursor = document.getElementById(`${x} ${y}`);
    cursor.innerText = cursor_direction ? ">" : "↓";
}

document.onkeydown = (e) => {
    if ("abcdefghijklmnopqrstuvwxyz".includes(e.key.toLowerCase()) && rack.includes(e.key.toLowerCase())) {
        if (cursor) {
            cursor.innerText = e.key.toUpperCase();
            added = "";
            while (Object.keys(placed).includes(e.key.toLowerCase() + added)) added += "*";
            placed[e.key.toLowerCase() + added] = cursor;
            typed += e.key.toLowerCase();
            try {
                do {
                    let [x, y] = cursor.id.split(" ");
                    if (cursor_direction) {
                        x = 1 + Number(x);
                    } else {
                        y = 1 + Number(y);
                    }
                    
                    cursor = document.getElementById(`${x} ${y}`);
                } while (cursor.innerText);
            } catch {cursor = null;}
            if (cursor) cursor.innerText = cursor_direction ? ">" : "↓";
            let ci = rack.indexOf(e.key.toLowerCase());
            rack = rack.slice(0, ci) + rack.slice(ci + 1);
            load_rack();
        }
    } else if ("abcdefghijklmnopqrstuvwxyz".includes(e.key.toLowerCase()) && rack.includes("?")) {
        if (cursor) {
            cursor.innerText = e.key.toLowerCase();
            let [x, y] = cursor.id.split(" ");
            added = "";
            while (Object.keys(placed).includes(e.key.toLowerCase() + added)) added += "*";
            placed[e.key.toLowerCase() + added] = cursor;
            squaresHM[cursor.id].is_blank = true;
            typed += e.key.toLowerCase();
            
            try {
                do {
                    let [x, y] = cursor.id.split(" ");
                    if (cursor_direction) {
                        x = 1 + Number(x);
                    } else {
                        y = 1 + Number(y);
                    }
                    
                    cursor = document.getElementById(`${x} ${y}`);
                } while (cursor.innerText);
            } catch {cursor = null;}
            let ci = rack.indexOf("?");
            rack = rack.slice(0, ci) + rack.slice(ci + 1);
            load_rack();
        }
    } 

    else if (e.key === "Backspace") {
        if (cursor) cursor.innerText = "";
        cursor = placed[glp()];
        rack += squaresHM[cursor.id].is_blank ? "?" : cursor.innerText.toLowerCase(); 
        squaresHM[placed[glp()].id].is_blank = false;
        delete placed[glp()];
        typed = typed.slice(0, typed.length - 1);
        cursor.innerText = cursor_direction ? ">" : "↓";
        rack = [...rack].sort().join("");
        load_rack();
    }

    else if (e.key === " ") {
        cursor.innerText = "";
        let [x, y] = cursor.id.split(" ");
        if (cursor_direction) {
            x = 1 + Number(x);
        } else {
            y = 1 + Number(y);
        }
        cursor = document.getElementById(`${x} ${y}`);
        if (cursor.innerText) cursor = null;
        cursor.innerText = cursor_direction ? ">" : "↓";
    }

    else if (e.key == "Enter") {
        score();
    }

    else if (e.key == "Escape") {
        exchange();
    }
}

function label_play(score) {
    let first = placed[typed[0]].id;
    let x = " ABCDEFGHIJKLMNO"[Number(first.split(" ")[0])];
    let y = first.split(" ")[1];
    let co;
    if (cursor_direction) {
        co = y + x;
    } else co = x + y;

    let [full_play, els] = get_parallel();
    let out = "";
    let i = 0;
    let open = false;
    for (let char of full_play) {
        if (char.toLowerCase() == char.toUpperCase()) { // Special character
            if (els[i].el.classList.contains("new")) {
                if (open) {
                    out += `)${conv_bs(char)}`;
                    open = false
                }
                else out += conv_bs(char);
            } else {
                if (open) out += conv_bs(char).toLowerCase();
                else {
                    out += `(${conv_bs(char).toLowerCase()}`;
                    open = true;
                }
            }
            open = !els[i].el.classList.contains("new");
        } else if (char == char.toUpperCase() && !open) {
            out += "(" + char;
            open = true;
        } else if (char == char.toLowerCase() && open) {
            out += ")" + char.toUpperCase();
            open = false;
        } else {
            out += char.toUpperCase();
        }
        i++;
    }

    if (open) out += ")";

    let len = document.querySelector(".history").innerText.split("\n");
    if (len.length == history_length) document.querySelector(".history").innerText = len.slice(1).join("\n");
    document.querySelector(".history").innerText += `${co} ${out}${typed.length == 7 ? " ❤️" : ""} +${score} =${player_scores[player] + score}\n`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function exchange() {
    if (bag.length >= 7 && rack.length == 7) {
        te = prompt("To exchange:").toLowerCase();
        for (let c of te) {
            if (!rack.includes(c)) return;
        }

        for (let c of te) {
            let ci = rack.indexOf(c);
            rack = rack.slice(0, ci) + rack.slice(ci + 1);
            bag += c;
        }

        for (let i = 0; i < te.length; i++) {
            let j = Math.round(Math.random() * (bag.length - 1));
            rack += bag[j];
            bag = bag.slice(0, j) + bag.slice(j + 1);
        }

        let len = document.querySelector(".history").innerText.split("\n");
        if (len.length == history_length) document.querySelector(".history").innerText = len.slice(1).join("\n");
        document.querySelector(".history").innerText += `exch. ${te.length}\n`;

        csc_zero++;
        if (csc_zero == 6) {
            end_game();
        }

        if (players == 2) {
            await sleep(1000);
            temp_hide();
            await sleep(1000);
        }

        racks[player] = rack;
        player = 3 - player;
        rack = racks[player];
        load_rack();
    }
}

async function pass() {
    if (typed) return;
    csc_zero++;
    if (csc_zero == 6) {
        end_game();
    }
    let len = document.querySelector(".history").innerText.split("\n");
    if (len.length == history_length) document.querySelector(".history").innerText = len.slice(1).join("\n");
    document.querySelector(".history").innerText += `pass\n`;
    if (players == 2) {
        await sleep(1000);
        temp_hide();
        await sleep(1000);
    }
    racks[player] = rack;
    player = 3 - player;
    rack = racks[player];
    load_rack();
}

async function end_game() {
    let p1r = 0;
    let p2r = 0;
    for (let char of racks[1]) {
        p1r += point_values[char == "?" ? "%" : char.toUpperCase()];
    }

    for (let char of racks[2]) {
        p2r += point_values[char == "?" ? "%" : char.toUpperCase()];
    }

    player_scores[1] += p2r * 2;
    player_scores[2] += p1r * 2;

    document.title = `${player == 1 ? "(" : ""}${player_scores[1]}${player == 1 ? ")" : ""} : ${player == 2 ? "(" : ""}${player_scores[2]}${player == 2 ? ")" : ""}`
    await sleep(1000);

    if (player_scores[1] == player_scores[2]) alert("It's a tie!");
    else {
        let winner = Math.max(player_scores[1], player_scores[2]);
        let idx = player_scores.indexOf(winner);
        alert(`Player ${idx} wins!`);
    }

    location.reload();
}

async function score() {
    for (let el of Object.values(placed)) el.classList.add("temp");
    if (!check_parallel() || !check_perpendicular()) {
        for (let el of document.querySelectorAll(".temp")) el.classList.remove("temp");
        return;
    }
    for (let el of document.querySelectorAll(".temp")) el.classList.remove("temp");


    [...document.querySelectorAll(".new")].forEach(e => {
        e.classList.remove("new");
        e.style.background = "#dc37c9";
        e.style.color = "white";
    });

    for (let el of Object.values(placed)) el.classList.add("new");

    let running = 0;
    let word_bonus = 1;
    for (let el of Object.values(placed)) {
        running += point_values[get_key(placed, el).toUpperCase().replaceAll("*", "")] * squaresHM[el.id].tile_bonus;
        word_bonus *= squaresHM[el.id].word_bonus;

        el.classList.remove("empty");
        el.style.background = "yellow";
        el.style.fontWeight = "600";
    }

    let word_score = running * word_bonus;
    if (!rack) word_score += 50;
    word_score += score_parallel(word_bonus);
    word_score += score_perpendicular();
    label_play(word_score);
    player_scores[player] += word_score;
    let l = rack.length;
    racks[player] = rack;
    if (!bag && !rack) {
        end_game();
    }
    for (let i = 0; i < 7 - l && bag; i++) {
        let j = Math.round(Math.random() * (bag.length - 1));
        racks[player] += bag[j];
        bag = bag.slice(0, j) + bag.slice(j + 1);
    }

    if (word_score == 0) csc_zero++;
    else csc_zero = 0;
    if (csc_zero == 6) {
        end_game();
    }

    if (players == 2) {
        await sleep(1000);
        temp_hide();
        await sleep(1000);
    }

    player = 3 - player;
    rack = racks[player];

    placed = {};
    typed = "";
    load_rack();
    turn++;

    if (cursor) cursor.innerText = "";
    cursor = null;

    document.title = `${player == 1 ? "(" : ""}${player_scores[1]}${player == 1 ? ")" : ""} : ${player == 2 ? "(" : ""}${player_scores[2]}${player == 2 ? ")" : ""}`
}

function get_sliceH(y) {
    let slices = [];
    for (let x = 1; x < 16; x++) slices.push(squaresHM[`${x} ${y}`]);
    return slices;    
}

function get_sliceV(x) {
    let slices = [];
    for (let y = 1; y < 16; y++) slices.push(squaresHM[`${x} ${y}`]);
    return slices;
}

function load_rack() {
    rack = [...rack].sort().join("");
    let daddy = document.querySelector(".rack");
    let i = 1;
    daddy.innerHTML = "";

    for (let char of rack) {
        let div = document.createElement("div");
        div.className = "square rack";
        div.innerText = char;
        div.style.left = `${i * 32}px`;
        div.style.top = `544px`;
        i++;
        daddy.appendChild(div);
    }
}

function glp() {
    let mrc = typed[typed.length - 1];
    added = "";
    while (Object.keys(placed).includes(mrc + added)) added += "*";
    return mrc + added.slice(0, added.length - 1);
}

let history_length = 21;

generate_board();

async function temp_hide() {
    document.querySelector(".cover").style.opacity = "1";
    await sleep(3000); // TODO: CSS
    document.querySelector(".cover").style.opacity = "0";
}
