<?php


namespace BookStack\Access\Controllers;

use BookStack\App\Providers\ConnectProvider;
use BookStack\Http\Controller;
use BookStack\Users\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use League\OAuth2\Client\Provider\Exception\IdentityProviderException;
use UnexpectedValueException;

class VATSIMConnectController extends Controller
{
    /**
     * The VATSIM Authentication Provider Instance
     */
    protected ConnectProvider $_provider;

    /**
     * Initialize the Controller with a new ConnectProvider instance
     */
    function __construct()
    {
        $this->_provider = new ConnectProvider();
    }

    /**
     * Authentication entrypoint
     * This function will handle the state and request of an authentication attempt
     */
    public function login(Request $request)
    {

        // Use this line only if you want to test the "LOCAL" backup authentication
        // while developing. NEVER USE IT IN PRODUCTION
        // if(config('app.env') !== 'production') return redirect()->route('vatsim.authentication.connect.local');

        // Initiation state is without 'code' and 'state'
        if (!$request->has('code') || !$request->has('state')) {
            try {
                // Initiate the authentication process using VATSIM Connect
                // 1. Test if the service is available at all.
                // 2. If available: Prepare the authentication url and send the user away to it
                $response = \Illuminate\Support\Facades\Http::timeout(30)->get(config('vatsim.authentication.connect.base'));
                if ($response->status() < 500 || $response->status() > 599) {
                    $authenticationUrl = $this->_provider->getAuthorizationUrl();
                    $request->session()->put('vatsim.authentication.connect.state', $this->_provider->getState());
                    return redirect()->away($authenticationUrl);
                } else {
                    // Send the user to the service unavailable page
                    Log::info("[ConnectController]::login::response::Status=" . $response->status() . ' ' . $response->reason());
                    return redirect()->route('vatsim.authentication.connect.failed');
                }

            } catch (\Illuminate\Http\Client\ConnectionException $ce) {
                // Send the user to the service unavailable page
                return redirect()->route('vatsim.authentication.connect.failed');
            }
        } elseif ($request->input('state') !== session()->pull('vatsim.authentication.connect.state')) {
            // Within this state there is no state. The only option here is to start again.
            $request->session()->invalidate(); // Invalidate and regenerate the session
            return redirect()->route('vatsim.authentication.connect.login');
        } else {
            return $this->_verifyLogin($request);
        }
    }

    /**
     * Check that all required data is received from the VATSIM Connect authentication system
     */
    protected function _verifyLogin(Request $request)
    {
        try {
            $accessToken = $this->_provider->getAccessToken('authorization_code', [
                'code' => $request->input('code')
            ]);
        } catch (UnexpectedValueException $e) {
            Log::error("[ConnectController]::_verifyLogin::AccessToken::" . $e->getMessage());
            return redirect()->route('vatsim.authentication.connect.failed'); // Wrong format received from the Connect service
        } catch (IdentityProviderException $e) {
            Log::error("[ConnectController]::_verifyLogin::AccessToken::" . $e->getMessage());
            return redirect()->route('vatsim.authentication.connect.failed');
        }

        try {
            $resourceOwner = json_decode(json_encode($this->_provider->getResourceOwner($accessToken)->toArray()));
            // $resourceOwner = $this->_provider->getResourceOwner($accessToken);
        } catch (UnexpectedValueException $e) {
            Log::error("[ConnectController]::_verifyLogin::ResourceOwner::" . $e->getMessage());
            return redirect()->route('vatsim.authentication.connect.failed');
        }

        if (!isset($resourceOwner->data) || !isset($resourceOwner->data->cid) || !isset($resourceOwner->data->personal->name_first) || !isset($resourceOwner->data->personal->name_last) || !isset($resourceOwner->data->personal->email) || $resourceOwner->data->oauth->token_valid !== "true") {
            return redirect()->route('vatsim.authentication.connect.failed');
        }
        // All checks completed. Let's finally sign in the user
        $user = $this->_completeLogin($resourceOwner, $accessToken);

        Auth::login($user, true);
        if ($request->has('email')) {
            session()->flashInput([
                'email' => $user->email,
            ]);
        }

        return redirect()->intended('/');
    }

    /**
     * Complete the authentication process.
     *
     * @param Object $resourceOwner
     * @param Object $accessToken
     * @return User
     */
    protected function _completeLogin($resourceOwner, $accessToken)
    {
        $user = User::query()->find($resourceOwner->data->cid);

        if (!$user) {
            // Create random user slug
            $value = $resourceOwner->data->cid;
            $slug = Str::slug($value, "-");

            // We need to create a new user here
            $user = User::query()->create([
                'id' => $resourceOwner->data->cid,
                'name' => $resourceOwner->data->cid,
                'fullname' => $resourceOwner->data->personal->name_first . ' ' . $resourceOwner->data->personal->name_last,
                'email' => $resourceOwner->data->personal->email,
                'slug' => $slug
            ]);

            // Add role to new user (default role = viewer)
            DB::table('role_user')->insert([
                'user_id' => $user->id,
                'role_id' => 4
            ]);

            // If the user has given us permanent access to the data
            if ($resourceOwner->data->oauth->token_valid) {
                $user->access_token = $accessToken->getToken();
                $user->refresh_token = $accessToken->getRefreshToken();
                $user->token_expires = $accessToken->getExpires();
            }


        } else {
            // We know the user exists, so we need to update their account data
            $user->update([
                'name' => $resourceOwner->data->cid,
                'fullname' => $resourceOwner->data->personal->name_first . ' ' . $resourceOwner->data->personal->name_last,
                'email' => $resourceOwner->data->personal->email,
            ]);

            //$user->tokens()->delete();

        }
        //$user->createToken('api-token');

        return $user->fresh();
    }

    /**
     * Display a failed message and then return to the login
     *
     */
    public function failed(): RedirectResponse
    {
        return redirect('/')->with('error','Error logging in. Please try again.');
    }

    /**
     * End an authenticated session
     */
    public function logout(): RedirectResponse
    {
        Auth::logout();

        return redirect()->route('landing')->with('success', 'Logged out successfully.');
    }
}
