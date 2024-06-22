<?php
return [
    'name' => env('VATSIM_OAUTH_NAME', 'VATSIM Connect'),
    'base' => env('VATSIM_OAUTH_BASE', 'https://auth-dev.vatsim.net'),
    'id' => env('VATSIM_OAUTH_CLIENT', 0),
    'secret' => env('VATSIM_OAUTH_SECRET', ''),
    'scopes' => env('VATSIM_OAUTH_SCOPES', 'full_name,email,vatsim_details,country'),
    'endpoints' => [
        'authorize' => env('VATSIM_OAUTH_AUTHORIZE_URI',
            env('VATSIM_OAUTH_BASE', 'https://auth-dev.vatsim.net') .'/oauth/authorize'),
        'token' => env('VATSIM_OAUTH_TOKEN_URI',
            env('VATSIM_OAUTH_BASE', 'https://auth-dev.vatsim.net') .'/oauth/token'),
        'user' => env('VATSIM_OAUTH_USER_URI',
            env('VATSIM_OAUTH_BASE', 'https://auth-dev.vatsim.net') .'/api/user'),
    ],
    'icon' => env('VATSIM_OAUTH_ICON', 'https://vatsim-forums.nyc3.digitaloceanspaces.com/monthly_2020_08/Vatsim-social_icon.thumb.png.e9bdf49928c9bd5327f08245a68d8304.png'),

];
