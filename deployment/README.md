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

2. (OPTIONAL, ONLY when the user uses the single host for the purpose of
   both control and deployment) 
   Run the following commands to enable localhost manipulation:
   ```shell
   # and always press ENTER until the key is sucessfully generated
   ssh-keygen -t rsa -C "ansible@localhost" 
   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
   ```

3. Run the `ansible-playbook` command under `ansible-workspace` directory 
   in the control machine to trigger deployment:

   - With independent control and deployed host: 
   ```shell
   ansible-playbook -i hosts playbook.yaml
   ```

   - With independent control and deployed host: 
   ```shell
   # -e == --extra-vars
   ansible-playbook -i hosts playbook.yaml -e "specified_host=tallyblog-local-deploy"
   ```