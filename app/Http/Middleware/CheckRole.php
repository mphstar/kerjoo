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
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect('/login');
        }

        // Use != instead of !== to handle type casting differences between environments
        if ($user->peran != $role) {
            // Redirect based on user's actual role
            if ($user->peran == 'admin') {
                return redirect('/dashboard');
            } else {
                return redirect('/pelaksana/tugas');
            }
        }

        return $next($request);
    }
}
