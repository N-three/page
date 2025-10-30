import React from 'react';
import AdminConsole from './modes/admin/AdminConsole.jsx';
import LoginForm from './modes/login/LoginForm.jsx';
import {getModeByWord, registerMode} from './modes/modeManager.js';

const INITIAL_WORD = 'aside';
const MAX_LEN = 5;
const T9_MAP = {
    '1': [],
    '2': ['a', 'b', 'c'],
    '3': ['d', 'e', 'f'],
    '4': ['g', 'h', 'i'],
    '5': ['j', 'k', 'l'],
    '6': ['m', 'n', 'o'],
    '7': ['p', 'q', 'r', 's'],
    '8': ['t', 'u', 'v'],
    '9': ['w', 'x', 'y', 'z'],
    '0': []
};

export default function App() {
    const year = new Date().getFullYear();
    const [slots, setSlots] = React.useState(() => INITIAL_WORD.slice(0, MAX_LEN).split(''));
    const [lastEditIndex, setLastEditIndex] = React.useState(-1);
    const [lastKeyInfo, setLastKeyInfo] = React.useState({key: null, index: 0, time: 0});
    const [touchStartX, setTouchStartX] = React.useState(null);
    const [isTouch, setIsTouch] = React.useState(false);
    const recentTouchUntilRef = React.useRef(0);
    const longPressIdsRef = React.useRef(new Set());
    const [keypadSticky, setKeypadSticky] = React.useState(false);
    const stickyTimerRef = React.useRef(null);

    const hasEmpty = slots.some(ch => !ch);
    const showKeypad = isTouch && (hasEmpty || keypadSticky);
    const firstEmpty = slots.findIndex(ch => !ch);
    const caretIndex = firstEmpty === -1 ? MAX_LEN : firstEmpty; // place at end when full
    const [activeMode, setActiveMode] = React.useState(null);
    const [session, setSession] = React.useState(() => {
        // Load session from localStorage on app start
        try {
            const saved = localStorage.getItem('aside_session');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Check if token hasn't expired
                if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
                    return parsed;
                } else {
                    // Token expired, remove from storage
                    localStorage.removeItem('aside_session');
                }
            }
        } catch (e) {
            // Invalid session data, remove it
            localStorage.removeItem('aside_session');
        }
        return null;
    });
    const mobileActivationTimerRef = React.useRef(null);

    const bumpKeypadSticky = React.useCallback(() => {
        setKeypadSticky(true);
        if (stickyTimerRef.current) {
            clearTimeout(stickyTimerRef.current);
        }
        stickyTimerRef.current = setTimeout(() => setKeypadSticky(false), 500);
    }, []);

    React.useEffect(() => () => {
        if (stickyTimerRef.current) clearTimeout(stickyTimerRef.current);
    }, []);

    // Save session to localStorage whenever it changes
    React.useEffect(() => {
        if (session) {
            localStorage.setItem('aside_session', JSON.stringify(session));
        } else {
            localStorage.removeItem('aside_session');
        }
    }, [session]);

    React.useEffect(() => {
        setIsTouch(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    }, []);

    // register modes
    React.useEffect(() => {
        registerMode('admin', {name: 'admin', word: 'admin'});
        registerMode('login', {name: 'login', word: 'login'});
    }, []);

    // mobile auto-activation when word matches admin
    React.useEffect(() => {
        if (activeMode) return;
        const word = slots.map(c => c || '').join('');
        const lw = word.toLowerCase();
        if (isTouch && (lw === 'admin' || lw === 'login')) {
            if (mobileActivationTimerRef.current) clearTimeout(mobileActivationTimerRef.current);
            mobileActivationTimerRef.current = setTimeout(() => setActiveMode(lw), 500);
        } else {
            if (mobileActivationTimerRef.current) {
                clearTimeout(mobileActivationTimerRef.current);
                mobileActivationTimerRef.current = null;
            }
        }
        return () => {
            if (mobileActivationTimerRef.current) {
                clearTimeout(mobileActivationTimerRef.current);
                mobileActivationTimerRef.current = null;
            }
        };
    }, [slots, isTouch, activeMode]);

    React.useEffect(() => {
        const onKeyDown = (e) => {
            const key = e.key;
            if (isTouch && showKeypad) return;
            if (activeMode) {
                return;
            }
            if (key === 'Backspace') {
                e.preventDefault();
                setSlots(prev => {
                    const next = [...prev];
                    for (let i = next.length - 1; i >= 0; i--) {
                        if (next[i] && next[i].length) {
                            next[i] = '';
                            setLastEditIndex(i);
                            break;
                        }
                    }
                    return next;
                });
                return;
            }
            if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
                e.preventDefault();
                const ch = key.toLowerCase();
                setSlots(prev => {
                    const next = [...prev];
                    for (let i = 0; i < MAX_LEN; i++) {
                        if (!next[i]) {
                            next[i] = ch;
                            setLastEditIndex(i);
                            break;
                        }
                    }
                    return next;
                });
            }
            if (key === 'Enter') {
                const word = slots.join('');
                const mode = getModeByWord(word);
                if (mode && (mode.name === 'admin' || mode.name === 'login')) {
                    e.preventDefault();
                    setActiveMode(mode.name);
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isTouch, showKeypad, activeMode, slots]);

    // Touch swipe: left swipe clears last letter
    const onTouchStart = (e) => {
        if (!isTouch) return;
        setTouchStartX(e.touches[0].clientX);
    };
    const onTouchEnd = (e) => {
        if (!isTouch || touchStartX == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        setTouchStartX(null);
        if (dx < -40) {
            // swipe left
            setSlots(prev => {
                const next = [...prev];
                for (let i = next.length - 1; i >= 0; i--) {
                    if (next[i] && next[i].length) {
                        next[i] = '';
                        setLastEditIndex(i);
                        break;
                    }
                }
                return next;
            });
        }
    };

    const fillNextEmpty = (value) => {
        setSlots(prev => {
            const next = [...prev];
            for (let i = 0; i < MAX_LEN; i++) {
                if (!next[i]) {
                    next[i] = value;
                    setLastEditIndex(i);
                    break;
                }
            }
            return next;
        });
        bumpKeypadSticky();
    };

    const replaceLastEdited = (value) => {
        if (lastEditIndex < 0) return;
        setSlots(prev => {
            const next = [...prev];
            next[lastEditIndex] = value;
            return next;
        });
    };

    // T9 input handling
    const handleT9Press = (digit, isLongPress = false) => {
        if (digit === '⌫') {
            setSlots(prev => {
                const next = [...prev];
                for (let i = next.length - 1; i >= 0; i--) {
                    if (next[i] && next[i].length) {
                        next[i] = '';
                        setLastEditIndex(i);
                        break;
                    }
                }
                return next;
            });
            bumpKeypadSticky();
            return;
        }
        const letters = T9_MAP[digit] || [];
        const now = Date.now();
        if (isLongPress || letters.length === 0) {
            fillNextEmpty(digit);
            setLastKeyInfo({key: null, index: 0, time: now});
            return;
        }
        if (lastKeyInfo.key === digit && now - lastKeyInfo.time < 800 && lastEditIndex >= 0) {
            // cycle letters in the last edited slot
            const nextIndex = (lastKeyInfo.index + 1) % letters.length;
            replaceLastEdited(letters[nextIndex]);
            setLastKeyInfo({key: digit, index: nextIndex, time: now});
            bumpKeypadSticky();
        } else {
            fillNextEmpty(letters[0]);
            setLastKeyInfo({key: digit, index: 0, time: now});
        }
    };

    // Long-press detection for keypad buttons
    const pointerHandlers = (digit) => {
        let timer = null;
        let startX = 0, startY = 0;
        let pId = null;
        return {
            onContextMenu: (e) => {
                e.preventDefault();
            },
            onPointerDown: (e) => {
                const isMouse = e.pointerType === 'mouse';
                if (isMouse) {
                    // For mouse, handle on pointerup only (single insert)
                    return;
                }
                // touch/pen: start long-press timer for digit
                e.preventDefault();
                pId = e.pointerId;
                startX = e.clientX;
                startY = e.clientY;
                timer = setTimeout(() => {
                    longPressIdsRef.current.add(pId);
                    handleT9Press(digit, true);
                }, 450);
            },
            onPointerMove: (e) => {
                if (!timer) return;
                const dx = Math.abs(e.clientX - startX);
                const dy = Math.abs(e.clientY - startY);
                if (dx > 10 || dy > 10) {
                    clearTimeout(timer);
                    timer = null;
                }
            },
            onPointerUp: (e) => {
                const isMouse = e.pointerType === 'mouse';
                if (isMouse) {
                    // Insert letter for mouse click on release
                    e.preventDefault();
                    handleT9Press(digit, false);
                    return;
                }
                // touch/pen: finalize long-press or tap
                e.preventDefault();
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                recentTouchUntilRef.current = Date.now() + 800;
                if (longPressIdsRef.current.has(e.pointerId)) {
                    // digit already inserted by long-press; consume and clear flag
                    longPressIdsRef.current.delete(e.pointerId);
                    return;
                }
                // quick tap -> insert letter
                handleT9Press(digit, false);
            },
            onClick: (e) => {
                e.preventDefault();
            }
        };
    };

    return (
        <div className="wrap">
            {session && (
                <div className="user-info" onClick={() => setSession(null)} style={{cursor: 'pointer'}}>
                    {session.user.username}
                </div>
            )}
            <main className="hero" aria-label="aside.network landing">
                {!activeMode && (
                    <h1 className="logo" aria-label="interactive word" role="textbox" aria-live="polite">
                        {Array.from({length: MAX_LEN}).map((_, i) => {
                            const ch = slots[i] || '';
                            const isRedA = i === 0 && ch === 'a';
                            return (
                                <React.Fragment key={i}>
                                    {caretIndex === i && (
                                        <span className="caret before" aria-hidden="true"></span>
                                    )}
                                    <span
                                        className={`slot${ch ? ' filled' : ' empty'}${isRedA ? ' a' : ''}${ch && ('il1'.includes(ch) ? ' narrow' : '')}`}
                                    >
                                {ch || '\u00A0'}
                            </span>
                                </React.Fragment>
                            );
                        })}
                        {caretIndex === MAX_LEN && (
                            <span className="caret after" aria-hidden="true"></span>
                        )}
                        {slots.some(ch => ch) && (
                            <button
                                className="delete-btn"
                                aria-label="Delete last letter"
                                onClick={() => {
                                    setSlots(prev => {
                                        const next = [...prev];
                                        for (let i = next.length - 1; i >= 0; i--) {
                                            if (next[i] && next[i].length) {
                                                next[i] = '';
                                                setLastEditIndex(i);
                                                break;
                                            }
                                        }
                                        return next;
                                    });
                                }}
                            >
                                ⌫
                            </button>
                        )}
                    </h1>
                )}
                {activeMode === 'admin' && (
                    <div style={{width: '100%', maxWidth: '900px'}}>
                        <AdminConsole onExit={() => {
                            setActiveMode(null);
                            setSlots(INITIAL_WORD.slice(0, MAX_LEN).split(''));
                            setLastEditIndex(-1);
                            setKeypadSticky(false);
                        }}/>
                    </div>
                )}
                {activeMode === 'login' && (
                    <div style={{width: '100%', maxWidth: '900px'}}>
                        <div className="logo" style={{fontSize: '3em', justifyContent: 'flex-start'}}>
                            <span className="a">l</span>ogin
                        </div>
                        <LoginForm
                            onSuccess={(sess) => {
                                setSession(sess);
                                setActiveMode(null);
                            }}
                            onClose={() => setActiveMode(null)}
                        />
                    </div>
                )}
            </main>
            {!activeMode && (
                <div className={`keypad-box${isTouch ? ' touch' : ''}`} aria-hidden={!showKeypad}>
                    {showKeypad && (
                        <div className="keypad" role="group" aria-label="T9 keypad">
                            <div className="row">
                                <button className="key" {...pointerHandlers('1')}>1</button>
                                <button className="key" {...pointerHandlers('2')}><span className="num">2</span><span
                                    className="letters">abc</span></button>
                                <button className="key" {...pointerHandlers('3')}><span className="num">3</span><span
                                    className="letters">def</span></button>
                            </div>
                            <div className="row">
                                <button className="key" {...pointerHandlers('4')}><span className="num">4</span><span
                                    className="letters">ghi</span></button>
                                <button className="key" {...pointerHandlers('5')}><span className="num">5</span><span
                                    className="letters">jkl</span></button>
                                <button className="key" {...pointerHandlers('6')}><span className="num">6</span><span
                                    className="letters">mno</span></button>
                            </div>
                            <div className="row">
                                <button className="key" {...pointerHandlers('7')}><span className="num">7</span><span
                                    className="letters">pqrs</span></button>
                                <button className="key" {...pointerHandlers('8')}><span className="num">8</span><span
                                    className="letters">tuv</span></button>
                                <button className="key" {...pointerHandlers('9')}><span className="num">9</span><span
                                    className="letters">wxyz</span></button>
                            </div>
                            <div className="row">
                                <button className="key" {...pointerHandlers('0')}>0</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <footer>
                <span>©{year} aside.network</span>
            </footer>
        </div>
    );
}

