Pod::Spec.new do |s|
  s.name = 'GymGeofence'
  s.version = '1.0.0'
  s.summary = 'Gym geofence plugin for One More'
  s.license = 'MIT'
  s.homepage = 'https://one-more.app'
  s.author = 'One More'
  s.source = { :git => 'https://github.com/one-more/app.git', :tag => s.version.to_s }
  s.ios.deployment_target = '15.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.1'
  s.source_files = 'ios/Sources/**/*.{swift,h,m,c,cc,mm,cpp}'
end
