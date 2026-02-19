<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $role
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect('/login');
        }

        // Support multiple roles: role:admin,pimpinan
        if (!in_array($user->peran, $roles)) {
            // Redirect based on user's actual role
            if ($user->peran == 'admin') {
                return redirect('/dashboard');
            } elseif ($user->peran == 'pimpinan') {
                return redirect('/pimpinan/penugasan');
            } else {
                return redirect('/pelaksana/tugas');
            }
        }

        return $next($request);
    }
}
