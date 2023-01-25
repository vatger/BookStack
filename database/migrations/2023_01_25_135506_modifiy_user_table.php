<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ModifiyUserTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasColumn('users', 'password')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('password');
            });
        }
        if (!Schema::hasColumn('users', 'access_token')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('access_token')->nullable();
            });
        }
        if (!Schema::hasColumn('users', 'refresh_token')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('refresh_token')->nullable();
            });
        }
        if (!Schema::hasColumn('users', 'token_expires')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('token_expires')->nullable();
            });
        }
        if (!Schema::hasColumn('users', 'fullname')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('fullname')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
