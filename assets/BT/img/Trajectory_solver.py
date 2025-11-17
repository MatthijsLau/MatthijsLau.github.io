#%%
from __future__ import annotations
import numpy as np
from tqdm import tqdm


class ODE():

    def __init__(self, mass, linear_drag = 0, quadratic_drag = 0, gravity = 0) -> None:
        self.mass, self.linear_coef, self.quadratic_coef, self.gravity_coef = mass, linear_drag, quadratic_drag, gravity
    
    def change_mass(self, mass) -> ODE:
        return ODE(mass, self.linear_coef, self.quadratic_coef, self.gravity_coef)
    
    def change_linear_drag(self, linear_drag) -> ODE:
        return ODE(self.mass, linear_drag, self.quadratic_coef, self.gravity_coef)

    def change_quadratic_drag(self, quadratic_drag) -> ODE:
        return ODE(self.mass, self.linear_coef, quadratic_drag, self.gravity_coef)
    
    def change_gravity(self, gravity) -> ODE:
        return ODE(self.mass, self.linear_coef, self.quadratic_coef, gravity)
    
    def gravity(self):
        diff_values = np.zeros(2)
        diff_values[-1] = -self.gravity_coef*self.mass
        return diff_values/self.mass

    def linear_drag(self, current_velocity):
        diff_values = np.zeros(2)
        diff_values = -self.linear_coef*current_velocity
        return diff_values/self.mass
        
    def quadratic_drag(self, current_velocity):
        diff_values = np.zeros(2)
        diff_values = -self.quadratic_coef * current_velocity * np.abs(current_velocity)
        return diff_values/self.mass

    def solve(self, initial_position, initial_velocity, time_span):
        n_time = time_span.shape[0]
        differential_time = time_span[1:] - time_span[:-1]
        self.position = np.zeros((n_time, 2))
        self.velocity = np.zeros((n_time, 2))
        self.position[0] = initial_position
        self.velocity[0] = initial_velocity
        for i, dt in tqdm(enumerate(differential_time)):
            acceleration = self.gravity() + self.linear_drag(self.velocity[i]) + self.quadratic_drag(self.velocity[i])
            self.velocity[i + 1] = self.velocity[i] + acceleration*dt
            self.position[i + 1] = self.position[i] + self.velocity[i]*dt


# %%
import matplotlib.pyplot as plt

plt.figure('Trajectory')

interactionless = ODE(6)
nodrag = interactionless.change_gravity(10)
lindrag = nodrag.change_linear_drag(.2)
quaddrag = lindrag.change_quadratic_drag(.001)
initial_position = [0,10]
initial_velocity = [15,3]

time_span = np.linspace(0, 1.8,10**3)

with open('./img/trajectory.txt', 'w') as file:
    quaddrag.solve(initial_position, initial_velocity,time_span)
    for a,b in zip(tqdm(quaddrag.position[:,0]),quaddrag.position[:,1]):
        file.write(f'{a} {b}\n')
    plt.plot(quaddrag.position[:,0],quaddrag.position[:,1], label = 'quad')

#with open('./img/trajectory_linear.txt', 'w') as file:
#    lindrag.solve(initial_position, initial_velocity,time_span)
#    for a,b in zip(tqdm(lindrag.position[:,0]),lindrag.position[:,1]):
#        file.write(f'{a} {b}\n')
#    plt.plot(lindrag.position[:,0],lindrag.position[:,1], label = 'lin')

#with open('./img/velocity_linear.txt', 'w') as file:
#    lindrag.solve(initial_position, initial_velocity,time_span)
#    for a,b in zip(tqdm(lindrag.velocity[:,0]),lindrag.velocity[:,1]):
#        file.write(f'{a} {b}\n')
        
with open('./img/trajectory_gravity.txt', 'w') as file:
    nodrag.solve(initial_position, initial_velocity,time_span)
    for a,b in zip(tqdm(nodrag.position[:,0]),nodrag.position[:,1]):
        file.write(f'{a} {b}\n')
    plt.plot(nodrag.position[:,0],nodrag.position[:,1], label = 'grav')
        
#with open('./img/trajectory_less.txt', 'w') as file:
#    interactionless.solve(initial_position, initial_velocity,time_span)
#    for a,b in zip(tqdm(interactionless.position[:,0]),interactionless.position[:,1]):
#        file.write(f'{a} {b}\n')
#    plt.plot(interactionless.position[:,0],interactionless.position[:,1], label = 'non')


plt.legend()
plt.show()