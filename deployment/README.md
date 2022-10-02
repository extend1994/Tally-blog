# Deployment Manual

## How to use `ansible-workspace`

1. Install `ansible` in a remote host (a.k.a control machine) used to 
   communicate with the deployed host. Take a host with Ubuntu OS for example:
   ```shell
   sudo apt install -y software-properties-common
   sudo apt-add-repository ppa:ansible/ansible
   sudo apt update -y
   sudo apt install -y ansible
   ```

2. Run the following commands in the control machine to trigger deployment:
   ```shell
   # under ansible-workspace directory
   ansible-playbook -i hosts playbook.yaml
   ```