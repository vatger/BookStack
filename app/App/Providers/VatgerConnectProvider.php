<?php

namespace BookStack\App\Providers;

use League\OAuth2\Client\Provider\GenericProvider;
use Illuminate\Support\Str;
use League\OAuth2\Client\Token\AccessToken;

class VatgerConnectProvider extends GenericProvider
{
    /**
     * Initialize the Provider from configuration
     */
    public function __construct()
    {
        parent::__construct([
                'clientId'                => config('connect.id'),
                'clientSecret'            => config('connect.secret'),
                'redirectUri'             => route('authentication.connect.login'),
                'urlAuthorize'            => config('connect.endpoints.authorize'),
                'urlAccessToken'          => config('connect.endpoints.token'),
                'urlResourceOwnerDetails' => config('connect.endpoints.user'),
                'scopes'                  => (Str::contains(config('connect.scopes'), ',')) ? str_replace(',', ' ', config('connect.scopes'),) : config('connect.scopes'),
                'scopeSeparator'          => ' '
            ]);
    }

    public function getMappedData(AccessToken $accessToken): array
    {
        $resourceOwner = json_decode(json_encode($this->getResourceOwner($accessToken)->toArray()));
        $token_valid = true; // idk
        return [
            'id' => $resourceOwner?->id,
            'firstname' => $resourceOwner?->firstname,
            'lastname' => $resourceOwner?->lastname,
            'email' => $resourceOwner?->email,
            'token_valid' => $token_valid,
            'access_token' => $token_valid ? $accessToken->getToken() : null,
            'refresh_token' => $token_valid ? $accessToken->getRefreshToken() : null,
            'token_expires' =>  $token_valid ? $accessToken->getExpires() : null,
        ];
    }
}
