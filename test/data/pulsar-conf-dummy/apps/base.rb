#
# Require everything and extend with additional modules
#
Bundler.require

extend Pulsar::Helpers::Capistrano

logger.level = Capistrano::Logger::TRACE
