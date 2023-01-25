  <form action="{{ route('vatsim.authentication.connect.login') }}" method="GET" id="login-form" class="mt-l">
        {!! csrf_field() !!}

        <div>
            <button id="oidc-login" class="button outline svg">
               <img src="{{ config('authentication.connect.icon') }}" height="30px">
                <span style="padding-left: 10px">{{ trans('auth.log_in_with', ['socialDriver' => 'VATSIM Connect']) }}</span>
            </button>
        </div>
  </form>
