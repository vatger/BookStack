  <form action="{{ route('authentication.connect.login') }}" method="GET" id="login-form" class="mt-l">
        {!! csrf_field() !!}

        <div>
            <button id="oidc-login" class="button outline svg">
                <img src="{{ config('connect.icon') }}" height="30px">
                <span style="padding-left: 10px">{{ trans('auth.log_in_with', ['socialDriver' => config('connect.name')]) }}</span>
            </button>
        </div>
  </form>
