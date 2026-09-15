import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const FamilyHearthPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#fdf8f6',
            100: '#f9eee9',
            200: '#f2dacd',
            300: '#e7bcab',
            400: '#d79681',
            500: '#c46d53', // Основной терракотовый цвет
            600: '#b2563d',
            700: '#94432f',
            800: '#7a382a',
            900: '#643126',
            950: '#361712',
        },
        colorScheme: {
            light: {
                surface: {
                    0: '#ffffff',
                    50: '#fcf8f6',
                    100: '#f7f1ee',
                    200: '#f0e6e2',
                    300: '#ebdcd7',
                    400: '#b5a8a4',
                    500: '#8c7a75',
                    600: '#5c4b47',
                    700: '#4a3b37',
                    800: '#3d2b27',
                    900: '#2c1e1b',
                    950: '#1a110f',
                },
                primary: {
                    color: '{primary.500}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.600}',
                    activeColor: '{primary.700}',
                },
                formField: {
                    background: '{surface.50}',
                    borderColor: '{surface.300}',
                    hoverBorderColor: '{primary.400}',
                    focusBorderColor: '{primary.500}',
                    borderRadius: '12px',
                    paddingX: '1rem',
                    paddingY: '0.75rem',
                },
            },
            dark: {
                surface: {
                    0: '#1e1816',
                    50: '#261f1c',
                    100: '#312925',
                    200: '#3d332e',
                    300: '#4d413b',
                    400: '#73635b',
                    500: '#99867c',
                    600: '#c2b0a5',
                    700: '#d9cdcf',
                    800: '#ebdcd7',
                    900: '#f7f1ee',
                    950: '#ffffff',
                },
                primary: {
                    color: '{primary.400}',
                    contrastColor: '#1e1816',
                    hoverColor: '{primary.300}',
                    activeColor: '{primary.200}',
                },
                formField: {
                    background: '{surface.50}',
                    borderColor: '{surface.200}',
                    hoverBorderColor: '{primary.400}',
                    focusBorderColor: '{primary.400}',
                    borderRadius: '12px',
                },
            },
        },
    },
    components: {
        inputtext: {
            colorScheme: {
                light: {
                    root: {
                        background: '#fdfaf9',
                        borderColor: '#ebdcd7',
                        color: '{surface.800}',
                    },
                },
            },
        },
        button: {
            colorScheme: {
                light: {
                    root: {
                        borderRadius: '12px',
                    },
                    outlined: {
                        primary: {
                            borderColor: '#ebdcd7',
                            color: '{surface.800}',
                            hoverBackground: '#fdfaf9',
                        },
                    },
                },
            },
        },
        checkbox: {
            colorScheme: {
                light: {
                    root: {
                        borderRadius: '6px',
                    },
                },
            },
        },
    },
});
