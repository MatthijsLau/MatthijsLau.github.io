import numpy as np
from scipy.integrate import solve_ivp
import matplotlib.pyplot as plt


def DiffFunc(t, vals, pars):
    M, q, E = pars
    x, y, px, py = vals
    dx = px - M*y/2
    dy = py + M*x/2
    dpx = -(py + M*x/2)*M/2 - 2*q*E*x
    dpx = -M/2*py - (M**2/4 + 2*q*E)*x
    dpy = (px - M*y/2)*M/2 - 2*q*E*y
    dpy = M/2*px - (M**2/4 + 2*q*E)*y

    return [dx, dy, dpx, dpy]


tmin, tmax = 0, 20*np.pi
N = 10**3
init_vals = [1, 1, -2, 2]
parameters = [[1/10,1/2,3/10]]
for pars in parameters:
    solution = solve_ivp(lambda t, vals: DiffFunc(t,vals,pars), (tmin, tmax), init_vals,
                        t_eval=np.linspace(tmin, tmax, N))

    with open('./img/electromagnetictrajectory.txt', 'w')  as file:
        for a,b in zip(solution.y[0], solution.y[1]):
            file.write(f'{a} {b}\n')

    plt.plot(solution.y[0, :], solution.y[1, :])
    plt.axis('equal')
    plt.show()
