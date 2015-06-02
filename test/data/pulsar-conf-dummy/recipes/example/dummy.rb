namespace :dummy do

  task :my_sleep do
    sleep 10
  end

  task :my_sleep_unkillable do
    trap('SIGTERM') do
      puts 'Received SIGTERM, ignoring...'
    end

    sleep 10
  end

  task :my_sleep_output do
    10.times do
      50.times do
        puts Array.new(10){ [*'0'..'9',*'A'..'Z',*'a'..'z'].sample }.join
      end
      sleep 1
    end
  end

end

namespace :deploy do
  task :default do
    sleep 10
  end

  task :pending do
    sleep 1
  end
end
